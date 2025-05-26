import admin from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import serviceAccount from "../secrets/firebase-adminsdk.json";

let initializedApp = false;

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any)
    });
    initializedApp = true;
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    initializedApp = false;
}

export function authenticateFirebase(token: string): Promise<DecodedIdToken> {
    if(!initializedApp) {
        return undefined;
    }
    // token is in Authentication header
    const user = admin.auth().verifyIdToken(token);
    return user;
}