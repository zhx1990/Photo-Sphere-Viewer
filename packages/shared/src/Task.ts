/**
 * @internal
 */
export const enum Status {
    DISABLED,
    PENDING,
    RUNNING,
    CANCELLED,
    DONE,
    ERROR,
}

/**
 * @internal
 */
export class Task {
    status: Status = Status.PENDING;

    constructor(
        public readonly id: string,
        public priority: number,
        private readonly fn: (task: Task) => Promise<any>
    ) {}

    start() {
        this.status = Status.RUNNING;
        return this.fn(this).then(
            () => {
                this.status = Status.DONE;
            },
            () => {
                this.status = Status.ERROR;
            }
        );
    }

    cancel() {
        this.status = Status.CANCELLED;
    }

    isCancelled() {
        return this.status === Status.CANCELLED;
    }
}
