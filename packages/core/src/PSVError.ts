export class PSVError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PSVError';
        (Error as any).captureStackTrace?.(this, PSVError);
    }
}
