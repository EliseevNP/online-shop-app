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
  seederStorageTableName: 'OnlineShopApp_Delivery_Seeds',
  migrationStorageTableName: 'OnlineShopApp_Delivery_Migrations',
  logging: false,
  define: {
    freezeTableName: true,
  },
  sync: false,
  minifyAliases: true,
  pool: {
    min: parseInt(process.env.MS_CFG_POSTGRES_POOL_MIN || '0') || 0,
    max: parseInt(process.env.MS_CFG_POSTGRES_POOL_MAX || '5') || 5,
    evict: parseInt(process.env.MS_CFG_POSTGRES_POOL_EVICT || '1000') || 1000,
  }
};
