import { Service } from 'moleculer-decorators';
import { Service as MoleculerService } from 'moleculer';
import path from 'path';
import { DBMixin } from '../common';
import * as DBConfig from '../db/config';
import { healthService } from '../app/services/HealthService';
import { notificationService } from '../app/services/NotificationService';

@Service({
  name: 'services.notification',
  version: 1,
  settings: {
    sync: false,
    dbConfig: DBConfig,
    dbModelsPath: path.join(__dirname, '../app/models'),
  },
  mixins: [
    DBMixin,
    healthService.getSchema(),
    notificationService.getSchema(),
  ],
  events: {
    'OrderCreated': {
      params: {
        deliveryInfo: {
          type: 'object',
          optional: false,
          props: {
            period: {
              type: 'object',
              optional: false,
              props: {
                from: {
                  type: 'DateTime',
                  optional: false,
                },
                to: {
                  type: 'DateTime',
                  optional: false,
                }
              }
            }
          }
        }
      },
      handler: notificationService.OrderCreatedEventHandler,
    },
    'CreateOrderFailed': notificationService.CreateOrderFailedEventHandler,
  }
})
export default class MolService extends MoleculerService {
}
