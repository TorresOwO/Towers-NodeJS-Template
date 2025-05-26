import { AppLocalStorage } from "./local-storage-utils";
import path from "path";

export class LocalDbUtils {

    static findAll<T>(tableName: string): { id: string, value: T }[] {
        return AppLocalStorage.getCollection<T>(path.join('local-database', tableName));
    }

    static findById<T>(tableName: string, id: string): T | null {
        const item = AppLocalStorage.getItem<T>(path.join('local-database', tableName, id));
        return item;
    }

    static save<T>(tableName: string, id: string | undefined, data: T): string {
        if (!tableName) {
            throw new Error("Table name required");
        }
        let itemId = id;
        if (!itemId) {
            const timestamp = Date.now().toString(36);
            const randomPart = Math.random().toString(36).substring(2, 6);
            itemId = `${timestamp}-${randomPart}`;
        }
        AppLocalStorage.setItem(path.join('local-database', tableName, itemId), data);
        return itemId;
    }

    static delete(tableName: string, id: string): void {
        if (!tableName || !id) {
            throw new Error("Table name and ID are required");
        }
        AppLocalStorage.removeItem(path.join('local-database', tableName, id));
    }

}