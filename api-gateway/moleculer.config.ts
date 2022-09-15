import { BrokerOptions, Errors, LogLevels } from 'moleculer';
import dotenv from 'dotenv';
import { RegisterCommonMetrics } from './src/common';
dotenv.config();

let logLevel: LogLevels = 'debug';
if (process.env.MS_CFG_LOG_LEVEL
  && ['fatal', 'error', 'warn', 'info', 'debug', 'trace'].indexOf(process.env.MS_CFG_LOG_LEVEL)) {
  logLevel = process.env.MS_CFG_LOG_LEVEL as LogLevels;
}

let metricsLogLevel: LogLevels = 'info';
if (process.env.MS_CFG_METRICS_LOG_LEVEL
  && ['fatal', 'error', 'warn', 'info', 'debug', 'trace'].indexOf(process.env.MS_CFG_METRICS_LOG_LEVEL)) {
  metricsLogLevel = process.env.MS_CFG_METRICS_LOG_LEVEL as LogLevels;
}

/**
 * Moleculer ServiceBroker configuration file
 *
 * More info about options: https://moleculer.services/docs/0.13/broker.html#Broker-options
 *
 * Overwrite options in production:
 * ================================
 *  You can overwrite any option with environment variables.
 *  For example to overwrite the "logLevel", use `LOGLEVEL=warn` env var.
 *  To overwrite a nested parameter, e.g. retryPolicy.retries, use `RETRYPOLICY_RETRIES=10` env var.
 *
 *  To overwrite broker’s deeply nested default options, which are not presented in "moleculer.config.ts",
 *  via environment variables, use the `MOL_` prefix and double underscore `__` for nested properties in .env file.
 *  For example, to set the cacher prefix to `MYCACHE`, you should declare an env var as
 *  `MOL_CACHER__OPTIONS__PREFIX=MYCACHE`.
 */
const brokerConfig: BrokerOptions = {
  // Namespace of nodes to segment your nodes on the same network.
  namespace: process.env.MS_CFG_NAMESPACE,

  // Enable/disable logging or use custom logger. More info: https://moleculer.services/docs/0.13/logging.html
  logger: process.env.MS_CFG_LOGGER.toLowerCase() === 'true',
  // Log level for built-in console logger. Available values: trace, debug, info, warn, error, fatal
  // @ts-ignore
  logLevel: {
    'METRICS': metricsLogLevel,
    '**': logLevel,
  },
  // Define transporter.
  // More info: https://moleculer.services/docs/0.13/networking.html
  transporter: process.env.MS_CFG_TRANSPORTER,

  // Define a serializer.
  // Available values: "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift".
  // More info: https://moleculer.services/docs/0.13/networking.html
  serializer: process.env.MS_CFG_SERIALIZER,

  // Number of milliseconds to wait before reject a request with a RequestTimeout error. Disabled: 0
  requestTimeout: parseInt(process.env.MS_CFG_REQUEST_TIMEOUT, 10),

  // Retry policy settings. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Retry
  retryPolicy: {
    // Enable feature
    enabled: process.env.MS_CFG_ENABLED.toLowerCase() === 'true',
    // Count of retries
    retries: parseInt(process.env.MS_CFG_RETRIES, 10),
    // First delay in milliseconds.
    delay: parseInt(process.env.MS_CFG_DELAY, 10),
    // Maximum delay in milliseconds.
    maxDelay: parseInt(process.env.MS_CFG_MAXDELAY, 10),
    // Backoff factor for delay. 2 means exponential backoff.
    factor: parseInt(process.env.MS_CFG_FACTOR, 10),
    // A function to check failed requests.
    check: (err: Errors.MoleculerRetryableError) => err && !!err.retryable,
  },

  // Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error.
  // (Infinite loop protection)
  maxCallLevel: parseInt(process.env.MS_CFG_MAXCALLLEVEL, 10),

  // Number of seconds to send heartbeat packet to other nodes.
  heartbeatInterval: parseInt(process.env.MS_CFG_HEARTBEATINTERVAL, 10),
  // Number of seconds to wait before setting node to unavailable status.
  heartbeatTimeout: parseInt(process.env.MS_CFG_HEARTBEATTIMEOUT, 10),

  // Tracking requests and waiting for running requests before shutdowning.
  // More info: https://moleculer.services/docs/0.13/fault-tolerance.html
  tracking: {
    // Enable feature
    enabled: process.env.MS_CFG_ENABLED.toLowerCase() === 'true',
    // Number of milliseconds to wait before shutdowning the process
    shutdownTimeout: parseInt(process.env.MS_CFG_SHUTDOWNTIMEOUT, 10),
  },

  // Disable built-in request & emit balancer. (Transporter must support it, as well.)
  disableBalancer: false,

  // Settings of Service Registry. More info: https://moleculer.services/docs/0.13/registry.html
  registry: {
    // Define balancing strategy.
    // Available values: "RoundRobin", "Random", "CpuUsage", "Latency"
    strategy: 'RoundRobin',
    // Enable local action call preferring.
    preferLocal: true,
  },

  // Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Circuit-Breaker
  circuitBreaker: {
    // Enable feature
    enabled: false,
    // Threshold value. 0.5 means that 50% should be failed for tripping.
    threshold: 0.5,
    // Minimum request count. Below it, CB does not trip.
    minRequestCount: 20,
    // Number of seconds for time window.
    windowTime: 60,
    // Number of milliseconds to switch from open to half-open state
    halfOpenTime: 10 * 1000,
    // A function to check failed requests.
    check: (err: Errors.MoleculerRetryableError) => err && err.code >= 500,
  },

  // Settings of bulkhead feature. More info: https://moleculer.services/docs/0.13/fault-tolerance.html#Bulkhead
  bulkhead: {
    // Enable feature.
    enabled: process.env.MS_CFG_ENABLED.toLowerCase() === 'true',
    // Maximum concurrent executions.
    concurrency: parseInt(process.env.MS_CFG_CONCURRENCY, 10),
    // Maximum size of queue
    maxQueueSize: parseInt(process.env.MS_CFG_MAXQUEUESIZE, 10),
  },

  // Enable parameters validation. More info: https://moleculer.services/docs/0.13/validating.html
  // Custom Validator class for validation.
  validator: null,

  // Enable metrics
  metrics: {
    enabled: String(process.env.MS_CFG_PROMETHEUS_ENABLED).toLowerCase() === 'true',
    // eslint-disable-next-line radix
    collectInterval: parseInt(process.env.MS_CFG_PROMETHEUS_COLLECT_INTERVAL || '5') || 5,
    reporter: [
      {
        type: 'Prometheus',
        options: {
          // HTTP port
          port: process.env.MS_CFG_PROMETHEUS_PORT || 3001,
          // HTTP URL path
          path: process.env.MS_CFG_PROMETHEUS_PATH || '/metrics',
          // Default labels which are appended to all metrics labels
          defaultLabels: (registry: any) => ({
            moleculer_namespace: registry.broker.namespace,
            moleculer_node_id: registry.broker.nodeID,
            microservice_name: 'api-gateway',
          }),
          includes: process.env.MS_CFG_PROMETHEUS_NODE_JS_METRICS?.split('|') || [
            'moleculer.broker.namespace',
            'moleculer.request.total',
            'moleculer.request.error.total',
            'moleculer.request.time',
            'process.memory.rss',
            'process.cpu.utilization',
            'process.fs.read',
            'process.fs.write',
          ],
        },
      },
    ],
  },

  // Rate of metrics calls. 1 means to measure every request, 0 means to measure nothing.

  // Register internal services ("$node").
  // More info: https://moleculer.services/docs/0.13/services.html#Internal-services
  internalServices: true,
  // Register internal middlewares.
  // More info: https://moleculer.services/docs/0.13/middlewares.html#Internal-middlewares
  internalMiddlewares: true,

  // Watch the loaded services and hot reload if they changed.
  // You can also enable it in Moleculer Runner with `--hot` argument
  hotReload: false,

  // Register custom middlewares
  middlewares: [
    RegisterCommonMetrics(),
  ],

  // Enable tracing
  tracing: {
    enabled: Boolean(process.env.MS_CFG_TRACING_ENABLED || false),
    events: Boolean(process.env.MS_CFG_TRACING_EVENTS || false),
    stackTrace: Boolean(process.env.MS_CFG_TRACING_STACKTRACE || false),
    exporter: {
      type: process.env.MS_CFG_TRACING_TYPE || 'Jaeger',
      options: {
        endpoint: null,
        host: process.env.MS_CFG_TRACING_JAEGER_HOST || '127.0.0.1',
        port: process.env.MS_CFG_TRACING_JAEGER_PORT || 6832,
        sampler: {
          type: 'Const',
          options: {},
        },
        tracerOptions: {},
        defaultTags: null,
      },
    },
  },

  // Register custom REPL commands.
  replCommands: null,
};

export = brokerConfig;
