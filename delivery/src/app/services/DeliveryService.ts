// import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import { Context } from 'moleculer';
import { ZonedDateTime } from '@js-joda/core';
import retry, { Options } from 'async-retry';
import { v4 } from 'uuid';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
import Courier from '../models/Courier';
import { parseDateTime, stringifyDateTime } from '../../common/helpers/date-utils';
import { Error } from '../../common/types/Error';

const RETRY_OPTIONS: Options = {
  minTimeout: 100,
  maxTimeout: 10000,
  retries: 3,
  onRetry: console.log,
};

@ServiceLink({ prefix: 'Delivery' })
class DeliveryService extends ActionService {
  @ActionLink({
    description: 'Создание курьера',
    params: {
      courierId: {
        type: 'uuid',
        optional: true,
        default: () => v4(),
      },
    },
  })
  public async CreateCourier(ctx: Context<{ courierId: string }>): Promise<Courier> {
    const { courierId } = ctx.params;

    const newCourierData = {
      courierId,
      revision: 0,
      slots: [],
    };
    const courier = await Courier.create(newCourierData);

    await ctx.broker.emit('CourierCreated', newCourierData);

    return courier;
  }

  @ActionLink({
    rest: 'DELETE /:id',
    description: 'Удаление курьера',
    params: {
      id: {
        type: 'uuid',
        optional: false,
      },
    },
  })
  public async DeleteCourier(ctx: Context<{ id: string }>): Promise<void> {
    const { id: courierId } = ctx.params;

    await Courier.destroy({ where: { courierId } });
    await ctx.broker.emit('CourierDeleted', { courierId });

    return;
  }

  /* ----------------------------- Event handlers ----------------------------- */
  async ItemReservedOnOrderCreateRequestedHandler(ctx: Context<{
    orderId: string,
    deliveryInfo: {
      period: {
        from: ZonedDateTime,
        to: ZonedDateTime,
      },
    },
    userId: string,
    paymentInfo: any,
    itemsInfo: any,
  }>) {
    ctx.broker.logger.info('Handling ItemReservedOnOrderCreateRequested event');

    const { orderId, userId, deliveryInfo, paymentInfo, itemsInfo } = ctx.params;

    await retry(async (stopRetry) => {1
      // Stock is singletone now
      const couriers = await Courier.findAll();
      const freeCourier = couriers.find((courier) => {
        return courier.slots.every((slot) => {
          const slotFrom = parseDateTime(slot.period.from)!;
          const slotTo = parseDateTime(slot.period.to)!;

          if (slotFrom.isAfter(deliveryInfo.period.from) && slotFrom.compareTo(deliveryInfo.period.to) >= 0) {
            return true;
          } else if (slotFrom.isBefore(deliveryInfo.period.from) && slotTo.compareTo(deliveryInfo.period.from) <= 0) {
            return true;
          } else {
            return false;
          }
        })
      })

      if (!freeCourier) {
        try {
          const error: Error = {
            code: 'NO_FREE_COURIERS',
            message: 'free courier not found',
            meta: { orderId, deliveryInfo }
          };

          await retry(async () => {
            await ctx.broker.emit('СourierAssignFailedOnOrderCreateRequested', {
              orderId,
              itemsInfo,
              errors: [error],
            });
          }, RETRY_OPTIONS);

          return;
        } catch (err) {
          console.log('err', err);
          stopRetry(err);
          return;
        }
      }

      const newSlot = {
        orderId,
        period: {
          from: stringifyDateTime(deliveryInfo.period.from),
          to: stringifyDateTime(deliveryInfo.period.to),
        },
      };

      const transaction = await this.db.transaction({ autocommit: false });

      try {
        await Promise.all([
          Courier.create({
            courierId: freeCourier.courierId,
            revision: freeCourier.revision + 1,
            slots: [
              ...freeCourier.slots,
              newSlot,
            ],
          }, { transaction }),
          freeCourier.destroy({ transaction }),
        ]);
  
        await transaction?.commit();
      } catch (error) {
        await transaction?.rollback();
        throw error;
      }

      try {
        await retry(async () => {
          await ctx.broker.emit('СourierAssignedOnOrderCreateRequested', {
            itemsInfo,
            orderId,
            userId,
            deliveryInfo: { ...deliveryInfo, courierId: freeCourier.courierId },
            paymentInfo,
          })          
        }, RETRY_OPTIONS);
      } catch (err) {
        console.log('err', err);
        stopRetry(err);
      }
    }, RETRY_OPTIONS);

    ctx.broker.logger.info('ItemReservedOnOrderCreateRequested event handled');
  }

  async PaymentProcessFailedOnOrderCreateRequestedHandler(ctx: Context<{
    orderId: string,
    deliveryInfo: { courierId: string },
    itemsInfo: any,
    errors: any,
  }>) {
    ctx.broker.logger.info('Handling PaymentProcessFailedOnOrderCreateRequested event');
    await retry(async (stopRetry) => {
      const { orderId, deliveryInfo, itemsInfo, errors } = ctx.params;

      const courier = await Courier.findOne({ where: { courierId: deliveryInfo.courierId } });
  
      if (!courier) {
        throw new Error(`courier#${deliveryInfo.courierId} not found`);
      }
  
      const newSlots = courier.slots.filter((slot) => slot.orderId !== orderId);
  
      const transaction = await this.db.transaction({ autocommit: false });
  
      try {
        await Promise.all([
          Courier.create({
            courierId: courier.courierId,
            revision: courier.revision + 1,
            slots: newSlots,
          }, { transaction }),
          courier.destroy({ transaction }),
        ]);
  
        await transaction?.commit();
      } catch (error) {
        await transaction?.rollback();
        throw error;
      }

      try {
        await retry(async () => {
          await ctx.broker.emit('СourierReleasedOnOrderCreateRequested', {
            orderId,
            itemsInfo,
            errors,
          })          
        }, RETRY_OPTIONS);
      } catch (err) {
        console.log('err', err);
        stopRetry(err);
      }
    }, RETRY_OPTIONS);

    ctx.broker.logger.info('PaymentProcessFailedOnOrderCreateRequested event handled');
  }
}

export const deliveryService = new DeliveryService();
