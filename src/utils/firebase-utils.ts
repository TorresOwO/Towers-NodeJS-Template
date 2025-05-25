import admin from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import serviceAccount from "../secrets/firebase-adminsdk.json";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any)
});

export function authenticateFirebase(token: string): Promise<DecodedIdToken> {
    // token is in Authentication header
    const user = admin.auth().verifyIdToken(token);
    return user;
}