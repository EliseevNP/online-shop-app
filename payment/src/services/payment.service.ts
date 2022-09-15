import { Service } from 'moleculer-decorators';
import { Service as MoleculerService } from 'moleculer';
import path from 'path';
import { DBMixin } from '../common';
import * as DBConfig from '../db/config';
import { healthService } from '../app/services/HealthService';
import { accountService } from '../app/services/AccountService';
import { balanceService } from '../app/services/BalanceService';

@Service({
  name: 'services.payment',
  version: 1,
  settings: {
    sync: false,
    dbConfig: DBConfig,
    dbModelsPath: path.join(__dirname, '../app/models'),
  },
  mixins: [
    DBMixin,
    healthService.getSchema(),
    accountService.getSchema(),
    balanceService.getSchema(),
  ],
  events: {
    'SignupRequested': accountService.SignupRequestedHandler,
    'СourierAssignedOnOrderCreateRequested': accountService.СourierAssignedOnOrderCreateRequestedHandler,
  }
})
export default class MolService extends MoleculerService {
}
