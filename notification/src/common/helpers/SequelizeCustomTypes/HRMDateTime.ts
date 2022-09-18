import {
  ZonedDateTime, ZoneOffset, LocalDateTime, ZoneId, DateTimeFormatter, nativeJs,
} from '@js-joda/core';
import { DataTypes } from 'sequelize';
import { parseDateTime } from '../date-utils';

const ABSTRACT = (DataTypes.ABSTRACT as any).prototype.constructor;

export interface HRMDateTimeOptions {
  isKeepTZ: boolean
}

export default class HRMDATETIME extends ABSTRACT {
  key: string;

  options: HRMDateTimeOptions;

  isKeepTZ = false;

  constructor(options?: HRMDateTimeOptions) {
    super();
    this.key = 'HRMDATETIME';
    this.options = options || { isKeepTZ: false };
    if (options) {
      this.isKeepTZ = options.isKeepTZ;
    }

    this._sanitize = (value: string | number | ZonedDateTime, opt: { raw: any }) => this.sanitize(value, opt);
  }

  static _convertFromTimestampOrString(date: number | string | Date): ZonedDateTime | null {
    if (!date) return null;
    if (typeof date === 'string') return parseDateTime(date);
    if (typeof date === 'number') return LocalDateTime.ofEpochSecond(date, ZoneOffset.UTC).atZone(ZoneOffset.UTC);
    return ZonedDateTime.from(nativeJs(date)).withZoneSameInstant(ZoneOffset.UTC);
  }

  sanitize(value: string | number | ZonedDateTime, options: { raw: any }) {
    if ((!options || (options && !options.raw))
      && !(value instanceof ZonedDateTime) && !!value) {
      const parsedDate = HRMDATETIME._convertFromTimestampOrString(value);
      if (parsedDate && !this.isKeepTZ && parsedDate.zone() !== ZoneOffset.UTC) {
        return parsedDate.withZoneSameInstant(ZoneOffset.UTC);
      }
      return parsedDate;
    }
    return value;
  }

  _isChanged(value: ZonedDateTime, originalValue: ZonedDateTime) {
    if (
      originalValue
      && !!value
      && (value === originalValue
      || (value instanceof ZonedDateTime && originalValue instanceof ZonedDateTime && value === originalValue))
    ) {
      return false;
    }
    // not changed when set to same empty value
    if (!originalValue && !value && originalValue === value) {
      return false;
    }
    return true;
  }

  _applyTimezone(date: ZonedDateTime, options: any) {
    if (options.timezone) {
      let tz = options.timezone;
      if (typeof tz === 'string') {
        tz = ZoneId.of(tz);
      }
      return date.withZoneSameInstant(tz);
    }

    return date;
  }

  _stringify(date: any | string, options: any) {
    if (typeof date === 'string'
      || typeof date === 'number'
      || date instanceof Date) {
      date = HRMDATETIME._convertFromTimestampOrString(date);
      date = this._applyTimezone(date, options);
    }
    return date.format(DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm:ssx'));
  }

  static parse(value: string | null): ZonedDateTime | null {
    if (!value) return null;
    let result;
    try {
      // postgres
      result = ZonedDateTime.parse(value, DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm:ss[.n][x]'));
    } catch (e1) {
      // SQLite format
      result = ZonedDateTime.parse(value, DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm:ss[.SSS][ XXX]'));
    }

    return result;
  }

  types: string[];

  stringify(value: unknown, options?: any): string {
    return this._stringify(value, options);
  }

  toSql(): string {
    return 'TIMESTAMP WITH TIME ZONE';
  }
}
