import { QueryInterface, DataTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

export = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const transaction = await queryInterface.sequelize.transaction({ autocommit: false });

    try {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"', { transaction });

      await queryInterface.createTable('notifications', {
        notification_id: {
          primaryKey: true,
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('uuid_generate_v4()::uuid'),
        },
        event_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        event_data: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
      }, {
        // IDK why comment option exists in docs, but do not declared in class
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        comment: 'Уведомления',
        transaction,
      });

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
      await queryInterface.dropTable('notifications', { transaction });

      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);

      await transaction.rollback();

      throw error;
    }
  },
};
