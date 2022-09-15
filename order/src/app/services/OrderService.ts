// import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import { Context, Errors } from 'moleculer';
import { v4 } from 'uuid';
import { ZonedDateTime } from '@js-joda/core';
import retry, { Options } from 'async-retry';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
import { EOrderStates } from '../enums/EOrderStates';
import Order from '../models/Order';
import { Error } from '../../common/types/Error';

const RETRY_OPTIONS: Options = {
  minTimeout: 100,
  maxTimeout: 10000,
  retries: 3,
  onRetry: console.log,
};


@ServiceLink({ prefix: 'Order' })
class OrderService extends ActionService {

  @ActionLink({
    rest: 'GET /:id',
    description: 'Получение заказа по идентификатору',
    params: {
      id: {
        type: 'uuid',
        optional: false,
      },
    },
  })
  public async GetOrderById(ctx: Context<{ id: string }, { user: { userId: string } }>): Promise<Order | null> {
    if (!ctx.meta.user.userId) { 
      throw new Errors.MoleculerClientError('Forbidden', 403);
    }

    const order = await Order.findOne({ where: { orderId: ctx.params.id, userId: ctx.meta.user.userId }});

    return order;
  }

  @ActionLink({
    description: 'Создание заказа',
    params: {
      orderId: {
        type: 'uuid',
        optional: true,
        default: () => v4(),
      },
      itemsInfo: {
        type: 'array',
        optional: false,
        min: 1,
        items: {
          type: 'object',
          props: {
            itemId: {
              type: 'uuid',
              optional: false,
            },
            count: {
              type: 'number',
              optional: false,
              integer: true,
              convert: true,
              min: 1
            },
          }
        }
      },
      deliveryInfo: {
        type: 'object',
        optional: false,
        props: {
          period: {
            type: 'object',
            optional: false,
            props: {
              from: {
                type: 'DateTime',
                optional: false,
              },
              to: {
                type: 'DateTime',
                optional: false,
              }
            }
          }
        }
      }
    },
  })
  public async CreateOrder(ctx: Context<{
    orderId: string,
    itemsInfo: Array<{
      itemId: string,
      count: number,
    }>
    deliveryInfo: {
      period: {
        from: ZonedDateTime,
        to: ZonedDateTime,
      },
    }
  }, { user: { userId: string } }>): Promise<Order> {
    const {
      orderId,
      itemsInfo,
      deliveryInfo,
    } = ctx.params;
    const { userId } = ctx.meta.user;

    const existingOrder = await Order.unscoped().findOne({ where: { orderId } });

    if (existingOrder?.orderId === orderId && existingOrder?.userId === userId) {
      // duplicated request, so just return existing user
      return existingOrder;
    } else if (existingOrder?.orderId === orderId) {
      throw new Errors.MoleculerClientError(`duplicated orderId#${orderId}`, 400, 'DUPLICATED_ORDER_ID')
    }

    const state = EOrderStates.PENDING;
    const revision = 0;

    const order = await Order.create({
      orderId,
      state,
      revision,
      userId,
      itemsInfo,
      deliveryInfo,
    });

    await ctx.broker.emit('OrderCreateRequested', {
      orderId,
      userId,
      itemsInfo,
      deliveryInfo,
    });

    return order;
  }

  /* ----------------------------- Event handlers ----------------------------- */
  async PaymentProcessedOnOrderCreateRequestedHandler(ctx: Context<{ orderId: string, deliveryInfo: { courierId: string } }>) {
    ctx.broker.logger.info('Handling PaymentProcessedOnOrderCreateRequested event');

    const { orderId, deliveryInfo: { courierId } } = ctx.params;

    await retry(async (stopRetry) => {
      const order = await Order.unscoped().findOne({ where: { orderId } });

      if (!order) {
        stopRetry(new Error(`order#${orderId} not found`));
        return;
      }

      const newOrderData = {
        orderId: order.orderId,
        revision: order.revision + 1,
        state: EOrderStates.CREATED,
        deliveryInfo: { ...order.deliveryInfo, courierId },
        userId: order.userId,
        itemsInfo: order.itemsInfo,
      }
      const transaction = await this.db.transaction({ autocommit: false });

      try {
        await Promise.all([
          Order.create(newOrderData, { transaction }),
          order.destroy({ transaction }),
        ]);
  
        await transaction?.commit();
      } catch (error) {
        await transaction?.rollback();
        throw error;
      }

      try {
        await retry(async () => {
          await ctx.broker.emit('OrderCreated', newOrderData)          
        }, RETRY_OPTIONS);
      } catch (err) {
        console.log('err', err);
        stopRetry(err);
      }
    }, RETRY_OPTIONS);

    ctx.broker.logger.info('PaymentProcessedOnOrderCreateRequested event handled');
  }

  async PaymentProcessFailedOnOrderCreateRequestedHandler(ctx: Context<{ orderId: string, errors: Array<Error> }>) {
    ctx.broker.logger.info('Handling PaymentProcessFailedOnOrderCreateRequested event');
    await createOrderFailedHandler(ctx);
    ctx.broker.logger.info('PaymentProcessFailedOnOrderCreateRequested event handled');
  }

  async СourierAssignFailedOnOrderCreateRequestedHandler(ctx: Context<{ orderId: string, errors: Array<Error> }>) {
    ctx.broker.logger.info('Handling СourierAssignFailedOnOrderCreateRequested event');
    await createOrderFailedHandler(ctx);
    ctx.broker.logger.info('СourierAssignFailedOnOrderCreateRequested event handled');

  }

  async ItemReservationFailedOnOrderCreateRequestedHandler(ctx: Context<{ orderId: string, errors: Array<Error> }>) {
    ctx.broker.logger.info('Handling ItemReservationFailedOnOrderCreateRequested event');
    await createOrderFailedHandler(ctx);
    ctx.broker.logger.info('ItemReservationFailedOnOrderCreateRequested event handled');
  }
}

export const orderService = new OrderService();

async function createOrderFailedHandler(ctx: Context<{ orderId: string, errors: Array<Error> }>) {
  const { orderId, errors } = ctx.params;

  ctx.service?.broker.logger.info(`[ORDER] errors: ${JSON.stringify(errors, null, 2)}`);

  await Order.unscoped().destroy({ where: { orderId } });
  await ctx.broker.emit('CreateOrderFailed', {
    orderId,
    errors,
  })
}
