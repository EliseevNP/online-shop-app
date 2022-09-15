import { ServiceBroker } from 'moleculer';
import cpuUsage from 'cpu-percentage';

const METRICS = {
  PROCESS_CPU_UTILIZATION: {
    type: 'gauge',
    name: 'process.cpu.utilization',
    description: 'Process CPU usage percentage',
  },
  PROCESS_FS_READ: {
    type: 'counter',
    name: 'process.fs.read',
    description: 'The number of times the file system had to perform input (block input operations)',
  },
  PROCESS_FS_WRITE: {
    type: 'counter',
    name: 'process.fs.write',
    description: 'The number of times the file system had to perform output (block output operations)',
  },
};

let updateMetricsTimer: NodeJS.Timeout;

export const RegisterCommonMetrics = (): any => ({
  created: (broker: ServiceBroker) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (broker.metrics.opts?.enabled) {
      // Register metrics
      broker.metrics.register(METRICS.PROCESS_CPU_UTILIZATION);
      broker.metrics.register(METRICS.PROCESS_FS_READ);
      broker.metrics.register(METRICS.PROCESS_FS_WRITE);

      // Get initial values
      let currentCpuUsage = cpuUsage();
      let resourceUsage = process.resourceUsage();

      // Set initial values
      broker.metrics.set(METRICS.PROCESS_CPU_UTILIZATION.name, currentCpuUsage.percent);
      broker.metrics.set(METRICS.PROCESS_FS_READ.name, resourceUsage.fsRead);
      broker.metrics.set(METRICS.PROCESS_FS_WRITE.name, resourceUsage.fsWrite);

      // Update metrics in interval
      updateMetricsTimer = setInterval(
        () => {
          currentCpuUsage = cpuUsage(currentCpuUsage);
          broker.metrics.set(METRICS.PROCESS_CPU_UTILIZATION.name, currentCpuUsage.percent);

          resourceUsage = process.resourceUsage();
          broker.metrics.set(METRICS.PROCESS_FS_READ.name, resourceUsage.fsRead);
          broker.metrics.set(METRICS.PROCESS_FS_WRITE.name, resourceUsage.fsWrite);
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (broker.metrics.opts?.collectInterval || 5) * 1000,
      );

      updateMetricsTimer.unref();
    }
  },

  stopped: () => {
    if (updateMetricsTimer) {
      clearInterval(updateMetricsTimer);
    }
  },
});
