export type TaskPriority = 'background' | 'user-blocking' | 'user-visible';

export interface BackgroundTask {
  id: string;
  task: () => void | Promise<void>;
  priority: TaskPriority;
  delay?: number;
}

export class BackgroundTaskService {
  private taskQueue: BackgroundTask[] = [];
  private isProcessing = false;
  private intervalId: number | null = null;

  /**
   * Schedule a task to run in the background
   */
  scheduleTask(task: () => void | Promise<void>, priority: TaskPriority = 'background'): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const backgroundTask: BackgroundTask = {
      id: taskId,
      task,
      priority
    };

    this.taskQueue.push(backgroundTask);
    this.processQueue();
    
    return taskId;
  }

  /**
   * Schedule a task with delay
   */
  scheduleDelayedTask(
    task: () => void | Promise<void>, 
    delay: number, 
    priority: TaskPriority = 'background'
  ): string {
    const taskId = `delayed_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setTimeout(() => {
      this.scheduleTask(task, priority);
    }, delay);
    
    return taskId;
  }

  /**
   * Schedule recurring task
   */
  scheduleRecurringTask(
    task: () => void | Promise<void>,
    interval: number,
    priority: TaskPriority = 'background'
  ): string {
    const taskId = `recurring_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const recurringTask = () => {
      this.scheduleTask(task, priority);
    };

    // Initial execution
    recurringTask();
    
    // Schedule recurring execution
    this.intervalId = window.setInterval(recurringTask, interval);
    
    return taskId;
  }

  /**
   * Process task queue using available APIs
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Use Scheduler API if available (Chrome 94+)
      if ('scheduler' in window && (window as any).scheduler) {
        await this.processWithScheduler();
      } else {
        // Fallback to requestIdleCallback or setTimeout
        await this.processWithFallback();
      }
    } catch (error) {
      console.error('Error processing background tasks:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process tasks using Scheduler API
   */
  private async processWithScheduler(): Promise<void> {
    const scheduler = (window as any).scheduler;
    
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) break;

      try {
        await scheduler.postTask(async () => {
          await task.task();
        }, { priority: task.priority });
      } catch (error) {
        console.error(`Error executing task ${task.id}:`, error);
      }
    }
  }

  /**
   * Process tasks using fallback methods
   */
  private async processWithFallback(): Promise<void> {
    const processNextTask = () => {
      if (this.taskQueue.length === 0) {
        this.isProcessing = false;
        return;
      }

      const task = this.taskQueue.shift();
      if (!task) return;

      try {
        const result = task.task();
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Error executing async task ${task.id}:`, error);
          });
        }
      } catch (error) {
        console.error(`Error executing task ${task.id}:`, error);
      }

      // Schedule next task
      if ('requestIdleCallback' in window) {
        requestIdleCallback(processNextTask);
      } else {
        setTimeout(processNextTask, 0);
      }
    };

    processNextTask();
  }

  /**
   * Auto-save functionality using background tasks
   */
  setupAutoSave<T>(
    getData: () => T,
    saveData: (data: T) => void,
    interval: number = 30000
  ): string {
    return this.scheduleRecurringTask(() => {
      try {
        const data = getData();
        saveData(data);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, interval, 'background');
  }

  /**
   * Check if Scheduler API is supported
   */
  isSchedulerSupported(): boolean {
    return 'scheduler' in window && !!(window as any).scheduler;
  }

  /**
   * Check if requestIdleCallback is supported
   */
  isIdleCallbackSupported(): boolean {
    return 'requestIdleCallback' in window;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; processing: boolean; supported: string } {
    let supported = 'setTimeout';
    if (this.isSchedulerSupported()) {
      supported = 'scheduler';
    } else if (this.isIdleCallbackSupported()) {
      supported = 'requestIdleCallback';
    }

    return {
      pending: this.taskQueue.length,
      processing: this.isProcessing,
      supported
    };
  }

  /**
   * Clear all pending tasks
   */
  clearQueue(): void {
    this.taskQueue = [];
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.clearQueue();
    this.isProcessing = false;
  }
}

export const backgroundTaskService = new BackgroundTaskService();