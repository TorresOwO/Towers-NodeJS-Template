import { RequestT, ResponseT, TowersFunctionsController } from "towers-express";
import { CustomFunction } from ".";

export const getAllFunctionsDetails: CustomFunction = {
    auth: false,
    description: "Get details of all registered functions",
    tags: ["functions"],
    responseSchema: {
        "200": {
            type: "object",
            properties: {
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Function name" },
                            description: { type: "string", description: "Function description" },
                            auth: { type: "boolean", description: "Whether the function requires authentication" },
                            rights: { 
                                type: "object", 
                                description: "Rights required to access the function",
                            },
                            body: { 
                                type: "array", 
                                items: { type: "object" }, 
                                description: "Request body schema" 
                            },
                            respose: { 
                                type: "array", 
                                items: { type: "object" }, 
                                description: "Response schema" 
                            },
                            tags: { 
                                type: "array", 
                                items: { type: "string" }, 
                                description: "Tags associated with the function" 
                            }
                        },
                        required: ["name", "description"]
                    }
                }
            },
            required: ["data"]
        }
    },
    method: async (req: RequestT, res: ResponseT) => {
        res.status(200).json({
            data: TowersFunctionsController.listFunctions().map(funcName => {
                const func = TowersFunctionsController.getFunction(funcName);
                return {
                    name: funcName,
                    description: func.description,
                    auth: func.auth || false,
                    rights: func.rights || {},
                    body: func.bodySchema || [],
                    respose: func.responseSchema || [],
                    tags: func.tags || [],
                };

            })
        });
    }
}

export const ping : CustomFunction = {
    auth: false,
    method: async (req: RequestT, res: ResponseT) => {
        res.status(200).json({ message: "pong" });
    },
    description: "Ping the server to check if it's running",
    tags: ["ping"],
    responseSchema: {
        "200": {
            type: "object",
            properties: {
                message: { type: "string", description: "Response message" }
            },
            required: ["message"]
        }
    }
}