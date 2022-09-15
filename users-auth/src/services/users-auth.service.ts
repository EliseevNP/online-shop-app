import { Service } from 'moleculer-decorators';
import { Service as MoleculerService } from 'moleculer';
import path from 'path';
import { DBMixin } from '../common';
import * as DBConfig from '../db/config';
import { healthService } from '../app/services/HealthService';
import { usersService } from '../app/services/UsersService';
import { authService } from '../app/services/AuthService';

@Service({
  name: 'services.users-auth',
  version: 1,
  settings: {
    sync: false,
    dbConfig: DBConfig,
    dbModelsPath: path.join(__dirname, '../app/models'),
  },
  mixins: [
    DBMixin,
    healthService.getSchema(),
    usersService.getSchema(),
    authService.getSchema(),
  ],
  events: {
    'PaymentAccountCreated': authService.PaymentAccountCreatedHandler,
  }
})
export default class MolService extends MoleculerService {
}
