import path from 'path';
import fs from 'fs';
import { Server } from "socket.io";
import { SocketUtils } from './utils/socket-utils';
import { TowersExpress } from 'towers-express';
import { addAllFunctions } from './functions';
import { CERTIFICATE_PATH, LOCAL_STORAGE_PATH, LOGS_PATH } from './vars';
import { LocalDbUtils } from './utils/database-utils';

// write here the path to your certificates
const certificatesUrl = CERTIFICATE_PATH;

const port = 3000;
const sslPort = 3443;

const towersExpress = new TowersExpress('/api/functions', port);
towersExpress.configureSSL(sslPort, {
    keyPath: path.join(certificatesUrl, 'privkey.pem'),
    certPath: path.join(certificatesUrl, 'fullchain.pem'),
});
towersExpress.start({
    onHttpsStart: (https) => {
        const io = new Server(https, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                allowedHeaders: ["Authorization", "X-API-KEY", "Origin", "X-Requested-With", "Content-Type", "Accept", "Access-Control-Allow-Request-Method"],
                credentials: false,
            }
        });

        console.log("Socket.io server started with SSL");
        SocketUtils.setupSocket(io,);
    }
});

// Initialize all functions
addAllFunctions();

// initilize logs and app local storage
// Ensure LOGS_PATH is defined and exists
if (!fs.existsSync(LOGS_PATH)) {
    fs.mkdirSync(LOGS_PATH, { recursive: true });
    console.log(`Created logs directory at ${LOGS_PATH}`);
}
// Ensure LOCAL_STORAGE_PATH is defined and exists
if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
    fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true });
    console.log(`Created local storage directory at ${LOCAL_STORAGE_PATH}`);
}
