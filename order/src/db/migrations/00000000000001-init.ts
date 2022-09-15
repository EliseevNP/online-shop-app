import { QueryInterface, DataTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

export = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const transaction = await queryInterface.sequelize.transaction({ autocommit: false });

    try {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"', { transaction });

      await queryInterface.createTable('orders', {
        order_id: {
          primaryKey: true,
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('uuid_generate_v4()::uuid'),
        },
        state: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        revision: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        items_info: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
          allowNull: false,
        },
        delivery_info: {
          type: DataTypes.JSONB,
          allowNull: false,
        }
      }, {
        // IDK why comment option exists in docs, but do not declared in class
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        comment: 'Заказы',
        transaction,
      });

      await queryInterface.addIndex(
        'orders',
        {
          name: 'orders_order_id_revision_unique',
          type: 'UNIQUE',
          fields: ['order_id', 'revision'],
          transaction,
        },
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
      await queryInterface.removeIndex('orders', 'orders_order_id_revision_unique', { transaction });
      await queryInterface.dropTable('orders', { transaction });

      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);

      await transaction.rollback();

      throw error;
    }
  },
};
