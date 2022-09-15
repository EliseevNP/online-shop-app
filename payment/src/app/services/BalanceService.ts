// import { Context, Errors } from 'moleculer';
import _, { values } from 'lodash';
import { Context, Errors } from 'moleculer';
import Decimal from 'decimal.js';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
import Account from '../models/Account';

@ServiceLink({ prefix: 'Balance' })
class BalanceService extends ActionService {
  @ActionLink({
    rest: 'PATCH /:id',
    description: 'Пополнение баланса пользователя',
    params: {
      id: {
        type: 'uuid',
        optional: false,
      },
      amount: {
        type: 'currency',
        optional: false,
        custom: (value: string) => value.replace(/,/g, ''),
      },
    },
  })
  public async ReplanishBalance(ctx: Context<{
    id: string,
    amount: string,
  }, { user: { userId: string } }>): Promise<Account | null> {
    const { userId } = ctx.meta.user;
    const { id: accountId, amount } = ctx.params;

    if (!userId) {
      throw new Errors.MoleculerClientError('Forbidden', 403);
    }

    const account = await Account.findOne({ where: { accountId, userId }});

    if (!account) {
      throw new Errors.MoleculerClientError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    const newAccountData = {
      revision: account.revision + 1,
      accountId: account.accountId,
      userId: account.userId,
      amount: new Decimal(account.amount).plus(amount),
    }
    let newAccount: Account;

    const transaction = await this.service.db.transaction({ autocommit: false });

    try {
      newAccount = await Account.create(newAccountData, { transaction });
      await account.destroy({ transaction });

      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }

    await ctx.broker.emit('BalanceHasBeenWithdrawaled', newAccountData);

    return newAccount;
  }

  @ActionLink({
    rest: 'PATCH /:id',
    description: 'Снятие денег с баланса пользователя',
    params: {
      id: {
        type: 'uuid',
        optional: false,
      },
      amount: {
        type: 'currency',
        optional: false,
        custom: (value: string) => value.replace(/,/g, ''),
      },
    },
  })
  public async WithdrawFromBalance(ctx: Context<{
    id: string,
    amount: string,
  }, { user: { userId: string } }>): Promise<Account | null> {
    const { userId } = ctx.meta.user;
    const { id: accountId, amount } = ctx.params;

    if (!userId) {
      throw new Errors.MoleculerClientError('Forbidden', 403);
    }

    const account = await Account.findOne({ where: { accountId, userId }});

    if (!account) {
      throw new Errors.MoleculerClientError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
    }

    const newAmount = new Decimal(account.amount).minus(amount);

    if (newAmount.lessThan(0)) {
      throw new Errors.MoleculerClientError('There are not enough funds on the account', 404, 'NOT_ENOUGH_FUNDS');
    }

    const newAccountData = {
      revision: account.revision + 1,
      accountId: account.accountId,
      userId: account.userId,
      amount: newAmount,
    }
    let newAccount: Account;

    const transaction = await this.service.db.transaction({ autocommit: false });

    try {
      newAccount = await Account.create(newAccountData, { transaction });
      await account.destroy({ transaction });

      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }

    await ctx.broker.emit('BalanceHasBeenWithdrawaled', newAccountData);

    return newAccount;
  }
}

export const balanceService = new BalanceService();
