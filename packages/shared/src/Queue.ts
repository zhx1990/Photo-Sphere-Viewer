import { Status, Task } from './Task';

/**
 * @internal
 */
export class Queue {
    private runningTasks: Record<string, boolean> = {};
    private tasks: Record<string, Task> = {};

    constructor(private readonly concurency = 4) {}

    enqueue(task: Task) {
        this.tasks[task.id] = task;
    }

    clear() {
        Object.values(this.tasks).forEach((task) => task.cancel());
        this.tasks = {};
        this.runningTasks = {};
    }

    setPriority(taskId: string, priority: number) {
        const task = this.tasks[taskId];
        if (task) {
            task.priority = priority;
            if (task.status === Status.DISABLED) {
                task.status = Status.PENDING;
            }
        }
    }

    disableAllTasks() {
        Object.values(this.tasks).forEach((task) => {
            task.status = Status.DISABLED;
        });
    }

    start() {
        if (Object.keys(this.runningTasks).length >= this.concurency) {
            return;
        }

        const nextTask = Object.values(this.tasks)
            .filter((task) => task.status === Status.PENDING)
            .sort((a, b) => b.priority - a.priority)
            .pop();

        if (nextTask) {
            this.runningTasks[nextTask.id] = true;

            nextTask.start().then(() => {
                if (!nextTask.isCancelled()) {
                    delete this.tasks[nextTask.id];
                    delete this.runningTasks[nextTask.id];
                    this.start();
                }
            });

            this.start(); // start tasks until max concurrency is reached
        }
    }
}
