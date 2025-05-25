import * as admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

export enum UserRightEnum {
    admin = "admin",
}

export async function userHasRight(uid: string | UserRecord, right: UserRightEnum): Promise<boolean> {
    try {
        let userRecord: UserRecord;
        if (typeof uid === 'string') {
            userRecord = await admin.auth().getUser(uid);
        } else {
            userRecord = uid;
        }
        return Boolean(userRecord.customClaims?.permissions?.[right] || userRecord.customClaims?.permissions?.admin);
    } catch (error) {
        console.error(`Error verificando claim '${right}' para usuario ${uid}:`, error);
        return false;
    }
}