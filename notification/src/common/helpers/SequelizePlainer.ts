import _ from 'lodash';
import { Model } from 'sequelize-typescript';
import {
  LocalDate, LocalDateTime, LocalTime, ZonedDateTime, ZoneOffset,
} from '@js-joda/core';
import { stringifyDate, stringifyDateTime, stringifyTime } from './date-utils';

type ReturnDates = Date | ZonedDateTime | LocalDate | LocalTime;
type ReturnCommon = Record<string, any> | Record<string, any>[] | null;
type AcceptableType = Model | Model[] | ReturnCommon | ReturnDates;

export function SequelizePlainer(entity: Date, isFormatDates: true): string;
export function SequelizePlainer(entity: Date, isFormatDates: false): Date;
export function SequelizePlainer(entity: Date, isFormatDates: true): string;
export function SequelizePlainer(entity: ZonedDateTime, isFormatDates: false): ZonedDateTime;
export function SequelizePlainer(entity: Date, isFormatDates: true): string;
export function SequelizePlainer(entity: LocalDate, isFormatDates: false): LocalDate;
export function SequelizePlainer(entity: Date, isFormatDates: true): string;
export function SequelizePlainer(entity: LocalTime, isFormatDates: false): LocalTime;
export function SequelizePlainer<T = Array<any>>(entity: Model[] | Record<string, any>[], isFormatDates?: boolean): T;
export function SequelizePlainer<T = any>(entity: Model | Record<string, any> | null, isFormatDates?: boolean): T | null;
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function SequelizePlainer<T = any>(entity: AcceptableType, isFormatDates = false): T | ReturnCommon | ReturnDates {
  if (entity === null) {
    return null;
  }

  if (_.isArray(entity)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return entity.map((data) => SequelizePlainer(data, isFormatDates));
  }

  if (!_.isObject(entity)) {
    return entity;
  }

  if (entity instanceof Model) {
    return SequelizePlainer(entity.get({ plain: true }), isFormatDates);
  }

  if (_.isDate(entity)) {
    if (isFormatDates) {
      // eslint-disable-next-line no-bitwise
      const date = LocalDateTime.ofEpochSecond(entity.valueOf() / 1000 << 0, ZoneOffset.UTC).atZone(ZoneOffset.UTC);
      return stringifyDateTime(date) as any;
    }
    return entity;
  } if (entity instanceof ZonedDateTime) {
    if (isFormatDates) {
      return stringifyDateTime(entity) as any;
    }
    return entity;
  } if (entity instanceof LocalDate) {
    if (isFormatDates) {
      return stringifyDate(entity) as any;
    }
    return entity;
  } if (entity instanceof LocalTime) {
    if (isFormatDates) {
      return stringifyTime(entity) as any;
    }
    return entity;
  } if (typeof entity.toDate === 'function' && _.isDate(entity.toDate())) {
    if (isFormatDates) {
      // eslint-disable-next-line no-bitwise
      const date = LocalDateTime.ofEpochSecond(entity.toDate().valueOf() / 1000 << 0, ZoneOffset.UTC).atZone(ZoneOffset.UTC);
      return stringifyDateTime(date) as any;
    }
  }

  _.forOwn(entity, (value, key) => {
    entity[key] = SequelizePlainer(value, isFormatDates);
  });

  return entity;
}
