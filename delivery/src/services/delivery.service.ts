import { Service } from 'moleculer-decorators';
import { Service as MoleculerService } from 'moleculer';
import path from 'path';
import { DBMixin } from '../common';
import * as DBConfig from '../db/config';
import { healthService } from '../app/services/HealthService';
import { deliveryService } from '../app/services/DeliveryService';

@Service({
  name: 'services.delivery',
  version: 1,
  settings: {
    sync: false,
    dbConfig: DBConfig,
    dbModelsPath: path.join(__dirname, '../app/models'),
  },
  mixins: [
    DBMixin,
    healthService.getSchema(),
    deliveryService.getSchema(),
  ],
  events: {
    'ItemReservedOnOrderCreateRequested': {
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
      handler: deliveryService.ItemReservedOnOrderCreateRequestedHandler,
    },
    'PaymentProcessFailedOnOrderCreateRequested': deliveryService.PaymentProcessFailedOnOrderCreateRequestedHandler,
  }
})
export default class MolService extends MoleculerService {
}
