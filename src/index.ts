import path from 'path';
import { Server } from "socket.io";
import { SocketUtils } from './utils/socket-utils';
import { TowersExpress } from 'towers-express';
import { addAllFunctions } from './functions';

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
