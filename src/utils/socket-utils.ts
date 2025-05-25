import { DefaultEventsMap, Server } from "socket.io";

export enum ServerSocketEvents {
    SERVER_STATUS = "serverStatus",
    SERVER_LOG = "serverLog",
}

export class SocketUtils {

    private static io: any;

    static setupSocket(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
        this.io = io;
    }

    public static emitServerEvent(serverId: string, event: ServerSocketEvents, data: any) {
        if (this.io) {
            this.io.emit(`${event}_${serverId}`, data);
        } else {
            console.error("Socket.io not initialized");
        }
    }

    static emitEvent(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        } else {
            console.error("Socket.io not initialized");
        }
    }

}