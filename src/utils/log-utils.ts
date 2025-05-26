import fs from 'fs';
import path from 'path';
import { LOGS_PATH } from '../vars';

export class LogUtils {
    private static logFilePath = LOGS_PATH;

    public static saveLog(id: string, log: string) {
        const date = new Date();
        const logLine = `${date.toISOString()} - ${log}\n`;
        fs.appendFile(path.join(this.logFilePath, id + ".log"), logLine, (err) => {
            if (err) {
                console.error('Error writing logs', err);
            }
        });
        return logLine;
    }

    public static getLogs(id: string): string[] {

        const filePath = path.join(this.logFilePath, id + ".log");
        if (!fs.existsSync(filePath)) return [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return data.split('\n').filter(line => line.trim() !== '');
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            return [];
        }
    }

}
