import { Task } from './Task';

/**
 * @summary Loading queue
 * @memberOf PSV.adapters.EquirectangularTilesAdapter
 * @package
 */
export class Queue {

  /**
   * @param {int} concurency
   */
  constructor(concurency) {
    this.concurency = concurency;
    this.runningTasks = {};
    this.tasks = {};
  }

  enqueue(task) {
    this.tasks[task.id] = task;
  }

  clear() {
    Object.values(this.tasks).forEach(task => task.cancel());
    this.tasks = {};
    this.runningTasks = {};
  }

  setPriority(taskId, priority) {
    if (this.tasks[taskId]) {
      this.tasks[taskId].priority = priority;
    }
  }

  setAllPriorities(priority) {
    Object.values(this.tasks).forEach((task) => {
      task.priority = priority;
    });
  }

  start() {
    if (Object.keys(this.runningTasks).length >= this.concurency) {
      return;
    }

    const nextTask = Object.values(this.tasks)
      .filter(task => task.status === Task.STATUS.PENDING && task.priority > 0)
      .sort((a, b) => a.priority - b.priority)
      .pop();

    if (nextTask) {
      this.runningTasks[nextTask.id] = true;

      nextTask.start()
        .then(() => {
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
