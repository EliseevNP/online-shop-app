import { Service } from 'moleculer-decorators';
import { Service as MoleculerService } from 'moleculer';
import path from 'path';
import { DBMixin } from '../common';
import * as DBConfig from '../db/config';
import { healthService } from '../app/services/HealthService';
import { orderService } from '../app/services/OrderService';

@Service({
  name: 'services.order',
  version: 1,
  settings: {
    sync: false,
    dbConfig: DBConfig,
    dbModelsPath: path.join(__dirname, '../app/models'),
  },
  mixins: [
    DBMixin,
    healthService.getSchema(),
    orderService.getSchema(),
  ],
  events: {
    'PaymentProcessedOnOrderCreateRequested': orderService.PaymentProcessedOnOrderCreateRequestedHandler,
    'PaymentProcessFailedOnOrderCreateRequested': orderService.PaymentProcessFailedOnOrderCreateRequestedHandler,
    'СourierAssignFailedOnOrderCreateRequested': orderService.СourierAssignFailedOnOrderCreateRequestedHandler,
    'ItemReservationFailedOnOrderCreateRequested': orderService.ItemReservationFailedOnOrderCreateRequestedHandler,
  }
})
export default class MolService extends MoleculerService {
}
