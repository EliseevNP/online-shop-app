import { QueryInterface, DataTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

export = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const transaction = await queryInterface.sequelize.transaction({ autocommit: false });

    try {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"', { transaction });

      await queryInterface.createTable('users', {
        user_id: {
          primaryKey: true,
          type: DataTypes.UUID,
          defaultValue: Sequelize.literal('uuid_generate_v4()::uuid'),
        },
        revision: {
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        state: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        password_hash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        surname: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        patronymic: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      }, {
        // IDK why comment option exists in docs, but do not declared in class
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        comment: 'Пользователи',
        transaction,
      });

      await queryInterface.addIndex(
        'users',
        {
          name: 'users_user_id_state_unique',
          type: 'UNIQUE',
          fields: ['user_id', 'state'],
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
      await queryInterface.removeIndex('users', 'users_user_id_state_unique', { transaction });
      await queryInterface.dropTable('users', { transaction });

      await transaction.commit();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);

      await transaction.rollback();

      throw error;
    }
  },
};
