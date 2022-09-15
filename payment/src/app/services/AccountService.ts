// import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import { Context } from 'moleculer';
import { v4 } from 'uuid';
import retry, { Options } from 'async-retry';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
import Account from '../models/Account';
import { Error } from '../../common/types/Error';
import Decimal from 'decimal.js';

const RETRY_OPTIONS: Options = {
  minTimeout: 100,
  maxTimeout: 10000,
  retries: 3,
  onRetry: console.log,
};

@ServiceLink({ prefix: 'Account' })
class AccountService extends ActionService {
  @ActionLink({
    description: 'Пополнение собственного счета',
  })
  public async GetSelfAccount(ctx: Context<{}, { user: { userId: string } }>): Promise<Account | null> {
    const { userId } = ctx.meta.user;

    return Account.findOne({ where: { userId } });
  }

  /* ----------------------------- Event handlers ----------------------------- */
  async SignupRequestedHandler(ctx: Context<{ userId: string }>) {
    ctx.broker.logger.info('Handling SignupRequested event');

    const { userId } = ctx.params;
    const existingAccount = await Account.findOne({ where: { userId } });

    if (existingAccount) {
      // duplicated request, so just return
      return;
    }

    const accountId = v4();
    const revision = 0;
    const amount = 0;

    await Account.create({
      accountId,
      revision,
      userId,
      amount
    });
    await ctx.broker.emit('PaymentAccountCreated', { accountId, userId, revision, amount });

    ctx.broker.logger.info('SignupRequested event handled');
  }

  async СourierAssignedOnOrderCreateRequestedHandler(ctx: Context<{
    orderId: string,
    userId: string,
    paymentInfo: { amount: string },
    itemsInfo: any,
    deliveryInfo: any,
  }>) {
    const {
      orderId,
      userId,
      paymentInfo,
      itemsInfo,
      deliveryInfo,
    } = ctx.params;

    await retry(async (stopRetry) => {

      const account = await Account.findOne({ where: { userId }});

      if (!account) {
        try {
          const error: Error = {
            code: 'ACCOUNT_NOT_FOUND',
            message: `account not found for user#${userId}`,
            meta: { userId },
          }

          await retry(async () => {
            await ctx.broker.emit('PaymentProcessFailedOnOrderCreateRequested', {
              itemsInfo,
              orderId,
              deliveryInfo,
              paymentInfo,
              errors: [error],
            })          
          }, RETRY_OPTIONS);

          return;
        } catch (err) {
          console.log('err', err);
          stopRetry(err);
          return;
        }
      }

      const amount = new Decimal(account.amount);
      const requestedAmount = new Decimal(paymentInfo.amount);
      const diff = amount.minus(requestedAmount);

      if (diff.lessThan(0)) {
        try {
          const error: Error = {
            code: 'NOT_ENOUGH_FUNDS',
            message: `there are not enough funds to create order`,
            meta: {
              amount,
              requestedAmount,
              diff,
            },
          }

          await retry(async () => {
            await ctx.broker.emit('PaymentProcessFailedOnOrderCreateRequested', {
              itemsInfo,
              orderId,
              deliveryInfo,
              paymentInfo,
              errors: [error],
            })          
          }, RETRY_OPTIONS);

          return;
        } catch (err) {
          console.log('err', err);
          stopRetry(err);
          return;
        }
      }

      const newAccountData = {
        revision: account.revision + 1,
        accountId: account.accountId,
        userId: account.userId,
        amount: diff,
      };

      const transaction = await this.db.transaction({ autocommit: false });

      try {
        await Promise.all([
          Account.create(newAccountData, { transaction }),
          account.destroy({ transaction }),
        ]);
  
        await transaction?.commit();
      } catch (error) {
        await transaction?.rollback();
        throw error;
      }

      try {
        await retry(async () => {
          await ctx.broker.emit('PaymentProcessedOnOrderCreateRequested', {
            orderId,
            deliveryInfo,
          })          
        }, RETRY_OPTIONS);

        return;
      } catch (err) {
        console.log('err', err);
        stopRetry(err);
        return;
      }
    }, RETRY_OPTIONS);
  }
}

export const accountService = new AccountService();
