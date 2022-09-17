import { DB_CONFIG } from '../common/config';

module.exports = {
  dialect: 'postgres',
  username: DB_CONFIG.username,
  password: DB_CONFIG.password,
  host: DB_CONFIG.host,
  database: DB_CONFIG.database,
  port: DB_CONFIG.port,
  seederStorage: 'sequelize',
  migrationStorage: 'sequelize',
  seederStorageTableName: 'OnlineShopApp_Payment_Seeds',
  migrationStorageTableName: 'OnlineShopApp_Payment_Migrations',
  logging: false,
  define: {
    freezeTableName: true,
  },
  sync: false,
  minifyAliases: true,
};
