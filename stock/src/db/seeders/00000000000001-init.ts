import fs from 'fs';
import path from 'path';
import { QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const transaction = await queryInterface.sequelize.transaction({ autocommit: false });

    try {
      await queryInterface.bulkInsert(
        'stocks',
        JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/seeds/v1-stocks.json')).toString('utf-8')),
        { transaction },
      );

      await queryInterface.bulkInsert(
        'items',
        JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../data/seeds/v1-items.json')).toString('utf-8')),
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);

      await transaction.rollback();

      throw error;
    }
  },
  down: async (queryInterface: QueryInterface): Promise<void> => {
    const transaction = await queryInterface.sequelize.transaction({ autocommit: false });

    try {
      await queryInterface.bulkDelete('items', {}, { transaction });
      await queryInterface.bulkDelete('stocks', {}, { transaction });

      await transaction.commit();
    } catch (error) {
    // eslint-disable-next-line no-console
      console.log(error);

      await transaction.rollback();

      throw error;
    }
  },
};
