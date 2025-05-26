import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { authenticateFirebase } from "../utils/firebase-utils";
import * as admin from 'firebase-admin';
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import { userHasRight, UserRightEnum } from "../utils/user-roles";
import { RequestT, ResponseT, TowersFunction, TowersFunctionsController } from "towers-express";
import { createUser, deleteUser, getAllUsers, getUserPermissions, getUserProfilePicture, updateUserPassword, updateUserPermissions, uploadUserProfilePicture } from "./users-functions";
import { getAllFunctionsDetails, ping } from "./test-functions";

export type CustomFunction = TowersFunction & {
    auth?: boolean;
    rights?: {
        user?: UserRightEnum[];
    };
}

const myFunctions: Record<string, CustomFunction> = {
    getAllFunctionsDetails,
    ping,
    // User management functions
    getAllUsers,
    deleteUser,
    createUser,
    updateUserPassword,
    updateUserPermissions,
    getUserPermissions,
    uploadUserProfilePicture,
    getUserProfilePicture,
    // Add more functions here
}

export const addAllFunctions = () => {
    for (const [key, value] of Object.entries(myFunctions)) {
        TowersFunctionsController.registerFunction(key, value as TowersFunction);
    }
    TowersFunctionsController.setAuthUserFunction(customAuthUser);
    TowersFunctionsController.setCheckRightsFunction(customCheckRights);
}

const customAuthUser = async (req: RequestT): Promise<UserRecord | undefined> => {
    let user: DecodedIdToken | undefined = undefined;
    try {
        user = await authenticateFirebase(req.headers.authorization.split(' ')[1]);
    } catch (error) {
        user = undefined;
    }
    const userRecord = user ? await admin.auth().getUser(user.uid) : undefined;
    return userRecord;
}

const customCheckRights = async (user: UserRecord, rights: CustomFunction['rights'], req: RequestT): Promise<string | undefined> => {
    const userRights = rights.user || [];

    for (const right of userRights) {
        const hasRight = await userHasRight(user, right);
        if (!hasRight) {
            return `You need the "${right}" right to access the function "${req.params.functionName}".`;
        }
    }

    return undefined;
}
