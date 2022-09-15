import {
  BrokerOptions, Errors, LogLevels,
} from 'moleculer';
import dotenv from 'dotenv';
import { RegisterCommonMetrics, MappingMiddleware } from './src/common';
import { VALIDATION_ALIASES } from './src/common/validation/aliases';

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: envFile });

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

if (!process.env.MS_CFG_TRANSPORTER) {
  throw new Error('Env variable MS_CFG_TRANSPORTER must be defined');
}

let requestTimeout = 1000;
if (process.env.MS_CFG_REQUEST_TIMEOUT) {
  const parsedTimeout = parseInt(process.env.MS_CFG_REQUEST_TIMEOUT);
  if (!Number.isNaN(parsedTimeout)) {
    requestTimeout = parsedTimeout;
  }
}

let namespace = 'api';
if (process.env.MS_CFG_NAMESPACE && process.env.MS_CFG_NAMESPACE.trim() !== '') {
  namespace = process.env.MS_CFG_NAMESPACE;
}

const brokerConfig: Partial<BrokerOptions> = {
  namespace,
  logger: true,
  logLevel: {
    METRICS: metricsLogLevel,
    '**': logLevel,
  },
  transporter: process.env.MS_CFG_TRANSPORTER,
  requestTimeout,
  retryPolicy: {
    enabled: Boolean((process.env.MS_CFG_RETRY_POLICY_ENABLED || 'false').toLowerCase() === 'true'),
    retries: +(process.env.MS_CFG_RETRY_POLICY_RETRIES || 5),
    delay: +(process.env.MS_CFG_RETRY_POLICY_DELAY || 100),
    maxDelay: +(process.env.MS_CFG_RETRY_POLICY_MAX_DELAY || 1000),
    factor: +(process.env.MS_CFG_RETRY_POLICY_FACTOR || 2),
    check: (err: Errors.MoleculerRetryableError): boolean => err && err.retryable,
  },
  tracking: {
    enabled: true,
    shutdownTimeout: 5000,
  },
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
  registry: {
    strategy: 'RoundRobin',
    preferLocal: true,
  },
  circuitBreaker: {
    enabled: true,
  },
  validator: {
    type: 'Fastest',
    options: {
      useNewCustomCheckerFunction: true, // used for override input type in custom check function
      aliases: VALIDATION_ALIASES,
    },
  },
  internalServices: true,
  internalMiddlewares: true,
  hotReload: Boolean((process.env.MS_CFG_HOTRELOAD_ENABLED || 'false').toLowerCase() === 'true'),
  middlewares: [
    MappingMiddleware(),
    RegisterCommonMetrics(),
  ],
  // Enable metrics
  metrics: {
    enabled: String(process.env.MS_CFG_PROMETHEUS_ENABLED).toLowerCase() === 'true',
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
            microservice_name: 'delivery',
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
};

export = brokerConfig;
