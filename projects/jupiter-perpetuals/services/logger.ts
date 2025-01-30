export interface Logger {
    error(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
}

export class ConsoleLogger implements Logger {
    error(message: string, ...args: any[]): void {
        console.error(message, ...args);
    }

    info(message: string, ...args: any[]): void {
        console.info(message, ...args);
    }

    debug(message: string, ...args: any[]): void {
        console.debug(message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(message, ...args);
    }
}

export class TestLogger implements Logger {
    logs: { level: string; message: string; args: any[] }[] = [];

    error(message: string, ...args: any[]): void {
        this.logs.push({ level: 'error', message, args });
    }

    info(message: string, ...args: any[]): void {
        this.logs.push({ level: 'info', message, args });
    }

    debug(message: string, ...args: any[]): void {
        this.logs.push({ level: 'debug', message, args });
    }

    warn(message: string, ...args: any[]): void {
        this.logs.push({ level: 'warn', message, args });
    }

    clear(): void {
        this.logs = [];
    }
}