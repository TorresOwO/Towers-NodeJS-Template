import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { authenticateFirebase } from "../utils/firebase-utils";
import * as admin from 'firebase-admin';
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import { userHasRight, UserRightEnum } from "../utils/user-roles";
import { RequestT, ResponseT, TowersFunction, TowersFunctionsController } from "towers-express";

type CustomFunction = TowersFunction & {
    auth?: boolean;
    rights?: {
        user?: UserRightEnum[];
    };
}

const ping: CustomFunction = {
    auth: false,
    method: async (req: RequestT, res: ResponseT) => {
        res.status(200).json({ message: 'pong' });
    }
}

const hubFunctions: Record<string, CustomFunction> = {
    ping,
}

export const addAllFunctions = () => {
    for (const [key, value] of Object.entries(hubFunctions)) {
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
