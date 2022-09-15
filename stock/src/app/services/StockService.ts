// import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import { Context } from 'moleculer';
import retry, { Options } from 'async-retry';
import Decimal from 'decimal.js';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
// import { EstockStates } from '../enums/EstockStates';
// import Stock from '../models/Stock';
import { Error } from '../../common/types/Error';
import Stock from '../models/Stock';
import Item from '../models/Item';
import { Sequelize } from 'sequelize-typescript';

const RETRY_OPTIONS: Options = {
  minTimeout: 100,
  maxTimeout: 10000,
  retries: 3,
  onRetry: console.log,
};

@ServiceLink({ prefix: 'Stock' })
class StockService extends ActionService {
  @ActionLink({})
  public async nothing(): Promise<any> {}

  /* ----------------------------- Event handlers ----------------------------- */
  async OrderCreateRequestedHandler(ctx: Context<{
    orderId: string,
    userId: string,
    itemsInfo: Array<{ itemId: string, count: number }>,
    deliveryInfo: any,
  }>) {
    ctx.broker.logger.info('Handling OrderCreateRequested event');

    const { orderId, userId, itemsInfo, deliveryInfo } = ctx.params;

    await retry(async (stopRetry) => {
      // Stock is singletone now
      const stock = await Stock.findOne();

      if (!stock) {
        stopRetry(new Error('stock not found'));
        return;
      }

      const errors: Array<Error> = [];
      const updateItemsData: Array<{ where: { itemId: string }, values: { count: number } }> = [];
      const paymentInfo = {
        orderId,
        amount: new Decimal(0),
      }

      itemsInfo.forEach(({ itemId: requestedItemId, count: requestedCount }) => {
        stock.items.forEach(({ itemId, count, coast }) => {
          if (itemId === requestedItemId) {
            const remainCount = count - requestedCount;

            if (remainCount < 0) {
              errors.push({
                code: 'NOT_ENOUGH_ITEMS_IN_STOCK',
                message: 'not enough items in stock',
                meta: {
                  itemId,
                  requestedCount,
                  count,
                  remainCount,
                }
              })
            } else {
              updateItemsData.push({
                where: { itemId },
                values: { count: remainCount }
              });
              paymentInfo.amount = paymentInfo.amount.plus(new Decimal(coast).mul(requestedCount));
            }
          }
        });
      });

      if (errors.length) {
        await ctx.broker.emit('ItemReservationFailedOnOrderCreateRequested', {
          orderId,
          errors,
        });
      } else {
        const transaction = await this.db.transaction({ autocommit: false });
  
        try {
          await Promise.all<any>([
            Stock.create({
              stockId: stock.stockId,
              revision: stock.revision + 1,
              title: stock.title,
            }, { transaction }),
            stock.destroy({ transaction }),
            ...updateItemsData.map(({ where, values }) => Item.update(values, { where, transaction }))
          ]);
    
          await transaction?.commit();
        } catch (error) {
          await transaction?.rollback();
          throw error;
        }

        try {
          await retry(async () => {
            await ctx.broker.emit('ItemReservedOnOrderCreateRequested', {
              itemsInfo,
              orderId,
              userId,
              deliveryInfo,
              paymentInfo,
            })          
          }, RETRY_OPTIONS);
        } catch (err) {
          console.log('err', err);
          stopRetry(err);
        }
      }
    }, RETRY_OPTIONS);

    ctx.broker.logger.info('OrderCreateRequested event handled');
  }

  async СourierAssignFailedOnOrderCreateRequestedHandler(ctx: Context<{
    orderId: string,
    itemsInfo: Array<{ itemId: string, count: number }>,
    errors: Array<Error>
  }>) {
    ctx.broker.logger.info('Handling СourierAssignFailedOnOrderCreateRequested event');
    await createOrderFailedHandler(ctx, this.db);
    ctx.broker.logger.info('СourierAssignFailedOnOrderCreateRequested event handled');
  }

  async СourierReleasedOnOrderCreateRequestedHandler(ctx: Context<{
    orderId: string,
    itemsInfo: Array<{ itemId: string, count: number }>,
    errors: Array<Error>
  }>) {
    ctx.broker.logger.info('Handling СourierReleasedOnOrderCreateRequested event');
    await createOrderFailedHandler(ctx, this.db);
    ctx.broker.logger.info('СourierReleasedOnOrderCreateRequested event handled');
  }
}

export const stockService = new StockService();

async function createOrderFailedHandler(ctx: Context<{
  orderId: string,
  itemsInfo: Array<{ itemId: string, count: number }>,
  errors: Array<Error>
}>, db: Sequelize) {
  const {
    orderId,
    itemsInfo,
    errors
  } = ctx.params;

  await retry(async (stopRetry) => {
    // Stock is singletone now
    const stock = await Stock.findOne();

    if (!stock) {
      stopRetry(new Error('stock not found'));
      return;
    }

    const updateItemsData: Array<{ where: { itemId: string }, values: { count: number } }> = [];

    itemsInfo.forEach(({ itemId: requestedItemId, count: requestedCount }) => {
      stock.items.forEach(({ itemId, count }) => {
        if (itemId === requestedItemId) {
          const increasedCount = count + requestedCount;
          
          updateItemsData.push({
            where: { itemId },
            values: { count: increasedCount }
          });
        }
      });
    });

    const transaction = await db.transaction({ autocommit: false });

    try {
      await Promise.all<any>([
        Stock.create({
          stockId: stock.stockId,
          revision: stock.revision + 1,
          title: stock.title,
        }, { transaction }),
        stock.destroy({ transaction }),
        ...updateItemsData.map(({ where, values }) => Item.update(values, { where, transaction }))
      ]);

      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }

    try {
      await retry(async () => {
        await ctx.broker.emit('ItemReleasedOnOrderCreateRequested', {
          orderId,
          errors,
        })          
      }, RETRY_OPTIONS);
    } catch (err) {
      console.log('err', err);
      stopRetry(err);
    }

  }, RETRY_OPTIONS);
}
