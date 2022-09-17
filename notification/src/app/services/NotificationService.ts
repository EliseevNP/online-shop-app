// import { Context, Errors } from 'moleculer';
import _ from 'lodash';
import { Context } from 'moleculer';
import { Options } from 'async-retry';
import { ZonedDateTime, DateTimeFormatter } from '@js-joda/core';
import {
  ActionLink, ActionService, ServiceLink,
} from '../../common';
import Notification from '../models/Notification';

const RETRY_OPTIONS: Options = {
  minTimeout: 100,
  maxTimeout: 10000,
  retries: 3,
  onRetry: console.log,
};

@ServiceLink({ prefix: 'Notification' })
class NotificationService extends ActionService {
  @ActionLink()
  public async nothing(_ctx: Context): Promise<any> {}

  /* ----------------------------- Event handlers ----------------------------- */
  async OrderCreatedEventHandler(ctx: Context<{
    orderId: string,
    revision: number,
    state: string,
    userId: string,
    itemsInfo: Array<{
      itemId: string,
      count: number,
    }>,
    deliveryInfo: {
      courierId: string,
      period: {
        from: ZonedDateTime,
        to: ZonedDateTime,
      },
    },
  }>) {
    ctx.broker.logger.info('Handling OrderCreatedEvent event');

    const { deliveryInfo: { period: { from, to } } } = ctx.params;

    await Promise.all([
      ctx.broker.call('v1.services.mailer.send', { 
        to: 'eliseev.np@yandex.ru',
        template: 'OrderCreated',
        locale: 'ru-RU',
        data: {
          from: from.format(DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm:ss')),
          to: to.format(DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm:ss')),
        }
      }),
      Notification.create({
        eventName: 'OrderCreated',
        eventData: ctx.params,
      }),
    ]);

    ctx.broker.logger.info('OrderCreatedEvent event handled');
  }

  async CreateOrderFailedEventHandler(ctx: Context<{
    orderId: string,
    errors: Array<{
      code: string,
      message: string,
      meta: { [key: string]: any },
    }>
  }>) {
    ctx.broker.logger.info('Handling CreateOrderFailedEvent event');

    const { errors } = ctx.params;

    let errorMessage: string;

    switch (errors[0]?.code) {
      case 'NOT_ENOUGH_ITEMS_IN_STOCK':
        errorMessage = 'Недостаточно товаров на складе :(';
        break;

      case 'NO_FREE_COURIERS':
        errorMessage = 'Нет свободных курьеров :(';
        break;

      case 'ACCOUNT_NOT_FOUND':
        errorMessage = 'Счет не найден :(';
        break;
    
      case 'NOT_ENOUGH_FUNDS':
        errorMessage = 'На счете недостаточно средств :(';
        break;

      default:
        errorMessage = '';
        break;
    }

    await Promise.all([
      ctx.broker.call('v1.services.mailer.send', { 
        to: 'eliseev.np@yandex.ru',
        template: 'CreateOrderFailed',
        locale: 'ru-RU',
        data: {
          error: errorMessage,
        }
      }),
      Notification.create({
        eventName: 'CreateOrderFailed',
        eventData: ctx.params,
      }),
    ]);

    ctx.broker.logger.info('CreateOrderFailedEvent event handled');
  }
}

export const notificationService = new NotificationService();
