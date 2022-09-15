import { Service } from 'moleculer-decorators';
import { Service as MoleculerService } from 'moleculer';
import path from 'path';
import { DBMixin } from '../common';
import * as DBConfig from '../db/config';
import { healthService } from '../app/services/HealthService';
import { stockService } from '../app/services/StockService';
import { itemService } from '../app/services/ItemService';

@Service({
  name: 'services.stock',
  version: 1,
  settings: {
    sync: false,
    dbConfig: DBConfig,
    dbModelsPath: path.join(__dirname, '../app/models'),
  },
  mixins: [
    DBMixin,
    healthService.getSchema(),
    stockService.getSchema(),
    itemService.getSchema(),
  ],
  events: {
    'OrderCreateRequested': stockService.OrderCreateRequestedHandler,
    'СourierAssignFailedOnOrderCreateRequested': stockService.СourierAssignFailedOnOrderCreateRequestedHandler,
    'СourierReleasedOnOrderCreateRequested': stockService.СourierReleasedOnOrderCreateRequestedHandler,
  }
})
export default class MolService extends MoleculerService {
}
