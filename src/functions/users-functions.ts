import { CustomFunction } from ".";
import { userHasRight, UserRightEnum } from "../utils/user-roles";
import * as admin from 'firebase-admin';
import { AppLocalStorage } from "../utils/local-storage-utils";
import path from 'path';

/**
 * Función para crear un nuevo usuario
 */
export const createUser: CustomFunction = {
    auth: true,
    rights: {
        user: [UserRightEnum.createUser]
    },
    bodySchema: {
        type: "object",
        properties: {
            email: { type: "string", format: "email", description: "Email del nuevo usuario" },
            password: { type: "string", description: "Contraseña del nuevo usuario" },
            displayName: { type: "string", description: "Nombre a mostrar del nuevo usuario" }
        },
        required: ["email", "password"],
        additionalProperties: false
    },
    method: async (req, res, user) => {
        try {
            const { email, password, displayName } = req.body;

            // Validar datos recibidos
            if (!email || !password) {
                return res.status(400).send({ error: "Email and password are required" });
            }

            // Crear usuario en Firebase
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: displayName || email
            });

            // Establecer claims personalizados
            const customClaims = {
                createdAt: Date.now()
            };

            await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

            // Devolver usuario creado
            res.status(201).send({
                data: {
                    user: {
                        uid: userRecord.uid,
                        email: userRecord.email,
                        displayName: userRecord.displayName
                    },
                    password // Nota: solo para desarrollo
                }
            });
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).send({ error: `Error creating user: ${error.message}` });
        }
    }
};

/**
 * Función para obtener todos los usuarios
 */
export const getAllUsers: CustomFunction = {
    auth: true,
    rights: {
        user: [UserRightEnum.viewUsers]
    },
    method: async (req, res, user) => {
        try {
            // Obtener usuarios de Firebase (máximo 1000 por defecto)
            const { users: firebaseUsers } = await admin.auth().listUsers();

            // Transformar a formato seguro
            const safeUsers = await Promise.all(firebaseUsers.map(async u => ({
                photoURL: u.photoURL,
                lastLogin: u.metadata.lastRefreshTime,
                uid: u.uid,
                email: u.email,
                displayName: u.displayName,
                isAdmin: await userHasRight(u.uid, UserRightEnum.admin),
                createdAt: u.customClaims?.createdAt,
                disabled: u.disabled,
            })));

            res.send({ data: safeUsers });
        } catch (error) {
            console.error("Error retrieving users:", error);
            res.status(500).send({ error: `Error retrieving users: ${error.message}` });
        }
    }
};

/**
 * Función para eliminar un usuario
 */
export const deleteUser: CustomFunction = {
    auth: true,
    rights: {
        user: [UserRightEnum.deleteUsers]
    },
    bodySchema: {
        type: "object",
        properties: {
            userId: { type: "string", description: "ID del usuario a eliminar" }
        },
        required: ["userId"],
        additionalProperties: false
    },
    method: async (req, res, user) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).send({ error: "User ID is required" });
            }

            // Verificar que el usuario existe
            const userRecord = await admin.auth().getUser(userId);

            // Prevenir eliminar al último administrador
            if (userRecord.customClaims?.admin) {
                const { users: allUsers } = await admin.auth().listUsers();
                const adminUsers = allUsers.filter(u => u.customClaims?.admin);

                if (adminUsers.length <= 1) {
                    return res.status(400).send({
                        error: "You cannot delete the last administrator user"
                    });
                }
            }

            // Eliminar usuario
            await admin.auth().deleteUser(userId);

            res.send({
                data: {
                    message: "User deleted successfully",
                    deletedUserId: userId
                }
            });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return res.status(404).send({ error: "User not found" });
            }

            console.error("Error deleting user:", error);
            res.status(500).send({ error: `Error deleting user: ${error.message}` });
        }
    }
};

/**
 * Función para actualizar la contraseña de un usuario
 */
export const updateUserPassword: CustomFunction = {
    auth: true,
    bodySchema: {
        type: "object",
        properties: {
            userId: { type: "string", description: "ID del usuario cuya contraseña se va a actualizar" },
            newPassword: { type: "string", description: "Nueva contraseña para el usuario" }
        },
        required: ["userId", "newPassword"],
        additionalProperties: false
    },
    method: async (req, res, user) => {
        try {
            const { userId, newPassword } = req.body;

            // Validar datos recibidos
            if (!userId || !newPassword) {
                return res.status(400).send({ error: "User ID and new password are required" });
            }

            // Verificar permisos
            const isOwnAccount = user.uid === userId;
            if (!(await userHasRight(user.uid, UserRightEnum.editUserPassword)) && !isOwnAccount) {
                return res.status(403).send({ error: "You don't have permission to change this user's password" });
            }

            // Actualizar contraseña
            await admin.auth().updateUser(userId, {
                password: newPassword
            });

            res.send({
                data: {
                    message: "Password updated successfully",
                    userId
                }
            });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return res.status(404).send({ error: "User not found" });
            }

            console.error("Error updating password:", error);
            res.status(500).send({ error: `Error updating password: ${error.message}` });
        }
    }
};

/**
 * Función para actualizar los permisos de un usuario
 */
export const updateUserPermissions: CustomFunction = {
    auth: true,
    rights: {
        user: [UserRightEnum.editUserRoles]
    },
    bodySchema: {
        type: "object",
        properties: {
            userId: { type: "string", description: "ID del usuario a actualizar" },
            permissions: {
                type: "array",
                items: { type: "string", enum: Object.values(UserRightEnum) },
                description: "Lista de permisos a asignar al usuario"
            }
        },
        required: ["userId", "permissions"],
        additionalProperties: false
    },
    method: async (req, res, user) => {
        try {
            const userId: string = req.body.userId;
            const rightsList: UserRightEnum[] = req.body.permissions;

            const permissions: Record<UserRightEnum, boolean> = rightsList.reduce((acc, right) => {
                acc[right] = true;
                return acc;
            }, {} as Record<UserRightEnum, boolean>);

            // Validar datos recibidos
            if (!userId || !permissions) {
                return res.status(400).send({ error: "ID de usuario y permisos son obligatorios" });
            }

            // Obtener usuario actual
            const userRecord = await admin.auth().getUser(userId);
            const currentClaims = userRecord.customClaims || {};

            // Si se está intentando quitar permisos de administrador, verificar que no sea el último admin
            const editingUserIsAdmin = await userHasRight(userRecord, UserRightEnum.admin);
            const userIsAdmin = await userHasRight(user, UserRightEnum.admin);
            if (editingUserIsAdmin && !permissions.admin && !userIsAdmin) {
                permissions.admin = true;
                // Un usario que no es admin no puede quitar el admin a otro usuario
            }

            // Actualizar claims
            const newClaims = { ...currentClaims, permissions };
            await admin.auth().setCustomUserClaims(userId, newClaims);

            res.send({
                data: {
                    message: "Permisos actualizados correctamente",
                    userId,
                    permissions: { permissions: newClaims.permissions }
                }
            });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return res.status(404).send({ error: "User not found" });
            }

            console.error("Error al actualizar permisos:", error);
            res.status(500).send({ error: `Error al actualizar permisos: ${error.message}` });
        }
    }
};

/**
 * Función para obtener los permisos de un usuario
 */
export const getUserPermissions: CustomFunction = {
    auth: true,
    bodySchema: {
        type: "object",
        properties: {
            userId: { type: "string", description: "ID del usuario del que se quieren obtener los permisos" }
        },
        required: ["userId"],
        additionalProperties: false
    },
    method: async (req, res, user) => {
        try {
            const { userId } = req.body;

            // Validar datos recibidos
            if (!userId) {
                return res.status(400).send({ error: "User ID is required" });
            }

            // Verificar permisos
            const isOwnAccount = user.uid === userId;
            if (!(await userHasRight(user, UserRightEnum.editUserRoles)) && !isOwnAccount) {
                return res.status(403).send({ error: "You don't have permission to view this user's permissions" });
            }

            // Obtener usuario
            const userRecord = await admin.auth().getUser(userId);

            // Extraer claims
            const claims = userRecord.customClaims || { permissions: {}, servers: {} };

            // permisos normales
            const rightsList: UserRightEnum[] = Object.values(UserRightEnum);
            const permissions: Record<UserRightEnum, boolean> = rightsList.reduce((acc, right) => {
                acc[right] = Boolean(claims.permissions[right]);
                return acc;
            }, {} as Record<UserRightEnum, boolean>);
            claims.permissions = permissions;
            claims.permissions.admin = Boolean(claims.permissions.admin);

            res.send({
                data: claims
            });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                return res.status(404).send({ error: "User not found" });
            }

            console.error("Error al obtener permisos:", error);
            res.status(500).send({ error: `Error al obtener permisos: ${error.message}` });
        }
    }
};

/**
 * Función para guardar la foto de perfil de un usuario
 */
export const uploadUserProfilePicture: CustomFunction = {
    auth: true,
    maxFiles: 1,
    method: async (req, res, user) => {
        // Verificar si hay un archivo adjunto
        if (!req.file) {
            res.status(400).send({ error: "No file has been uploaded" });
            return;
        }

        const fileName = user.uid; // Usar el UID del usuario como nombre de archivo
        const result = AppLocalStorage.saveFile(path.join("profile-pictures", fileName), req.file.buffer, false);
        if (!result.success) {
            res.status(500).send({ error: `Error saving profile picture: ${result.error}` });
            return;
        }

        // enviar en la respuesta la url de la imagen guardada
        return res.send({
            data: {
                message: "Profile picture uploaded successfully",
                url: "/getUserProfilePicture?path=" + result.name,
            }
        });
    }
}

/**
 * Función para obtener la foto de perfil de un usuario
 */
export const getUserProfilePicture: CustomFunction = {
    auth: false,
    bodySchema: {
        type: "object",
        properties: {
            uid: { type: "string", description: "ID del usuario del que se quiere obtener la foto de perfil" }
        },
        required: ["uid"],
        additionalProperties: false
    },
    method: async (req, res) => {
        const { uid } = req.body;

        // Validar datos recibidos
        if (!uid) {
            return res.status(400).send({ error: "User ID is required" });
        }

        const buffer = AppLocalStorage.getFile(path.join("profile-pictures", uid))

        // Enviar el archivo de imagen
        if (!buffer) {
            return res.status(404).send({ error: "Profile picture not found" });
        }
        res.setHeader('Content-Type', 'image/jpeg'); // Cambia el tipo según el formato de la imagen
        res.setHeader('Content-Disposition', `inline; filename="${uid}.jpg"`); // Cambia la extensión según el formato de la imagen
        res.send(buffer);
    }
}