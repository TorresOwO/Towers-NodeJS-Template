import fs from "fs";
import path from "path";
import { LOCAL_STORAGE_PATH } from "../vars";

export class AppLocalStorage {
    public static storageDir = LOCAL_STORAGE_PATH;

    private static getFilePath(key: string): string {
        return path.join(this.storageDir, `${key}.json`);
    }

    private static getCollectionPath(key: string): string {
        return path.join(this.storageDir, `${key}`);
    }

    static setItem(key: string, value: any) {
        const filePath = this.getFilePath(key);
        try {
            // Ensure the directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
        } catch (error) {
            console.error(`Error writing to ${filePath}:`, error);
        }
    }
    
    static getCollection<T>(key: string): {id: string, value: T}[] {
        const collectionPath = this.getCollectionPath(key);
        if (!fs.existsSync(collectionPath)) return [];

        try {
            const files = fs.readdirSync(collectionPath);
            return files.map(file => {
                const filePath = path.join(collectionPath, file);
                const data = fs.readFileSync(filePath, "utf-8");
                return {id: file.replace('.json', ''), value: JSON.parse(data) as T};
            });
        } catch (error) {
            console.error(`Error reading collection ${collectionPath}:`, error);
            return [];
        }
    }

    static getItem<T>(key: string): T | null {
        const filePath = this.getFilePath(key);
        if (!fs.existsSync(filePath)) return null;

        try {
            const data = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            return null;
        }
    }

    static removeItem(key: string) {
        const filePath = this.getFilePath(key);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error(`Error deleting ${filePath}:`, error);
            }
        }
    }

    /**
     * Guarda un archivo en la carpeta de imágenes
     * @param fileName Nombre del archivo a guardar
     * @param fileData Datos del archivo como Buffer
     * @param makeUnique Si es true, agrega timestamp para crear nombre único
     * @returns Objeto con el resultado de la operación
     */
    static saveFile(fileName: string, fileData: Buffer, makeUnique = false): { success: boolean; name?: string; error?: string } {
        // Sanitiza el nombre del archivo
        const imagesDir = path.join(this.storageDir, "files");
        const filePath = path.join(imagesDir, fileName);
        const fileNamePath = path.dirname(fileName);
        const fullDir = path.dirname(filePath);
        const onlyName = path.basename(fileName);

        let sanitizedFileName = onlyName.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        if (makeUnique) {
            // Agrega timestamp para asegurar nombres únicos
            const nameParts = sanitizedFileName.split('.');
            const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
            const base = nameParts.join('.');
            sanitizedFileName = `${base}_${Date.now()}${ext}`;
        }
        
        // Asegura que el directorio de imágenes existe
        if (!fs.existsSync(fullDir)) {
            try {
                fs.mkdirSync(fullDir, { recursive: true });
            } catch (error) {
                console.error(`Error al crear directorio ${fullDir}:`, error);
                return { 
                    success: false, 
                    error: `No se pudo crear el directorio: ${(error as Error).message}` 
                };
            }
        }
        
        
        try {
            fs.writeFileSync(filePath, fileData);
            return { 
                success: true, 
                name: path.join(fileNamePath, sanitizedFileName)
            };
        } catch (error) {
            console.error(`Error al escribir archivo ${filePath}:`, error);
            return { 
                success: false, 
                error: `No se pudo escribir el archivo: ${(error as Error).message}` 
            };
        }
    }

    static getFile(fileName: string): Buffer | null {
        const filePath = path.join(this.storageDir, "files", fileName);
        if (!fs.existsSync(filePath)) return null;

        try {
            return fs.readFileSync(filePath);
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            return null;
        }
    }
}
