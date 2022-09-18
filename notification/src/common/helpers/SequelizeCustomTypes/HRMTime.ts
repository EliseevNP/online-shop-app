import {
  ZoneOffset, LocalDateTime, DateTimeFormatter, LocalTime,
} from '@js-joda/core';
import { DataTypes } from 'sequelize';
import { parseTime } from '../date-utils';

const ABSTRACT = (DataTypes.ABSTRACT as any).prototype.constructor;
export interface HRMTimeOptions {
  isShort: boolean
}
export default class HRMTIME extends ABSTRACT {
  key: string;

  isShort = false;

  constructor(options?: HRMTimeOptions) {
    super();
    this.key = 'HRMTIME';
    this.options = options || { isShort: false };
    if (options) {
      this.isShort = options.isShort;
    }
    this._sanitize = (value: string | number | LocalTime, opt: { raw: any }) => this.sanitize(value, opt);
  }

  static _convertFromTimestampOrString(date: number | string): LocalTime | null {
    return typeof date === 'string'
      ? parseTime(date)
      : LocalDateTime.ofEpochSecond(date, ZoneOffset.UTC).toLocalTime();
  }

  sanitize(value: string | number | LocalTime, options: { raw: any }) {
    if ((!options || (options && !options.raw))
      && !(value instanceof LocalTime) && !!value) {
      return HRMTIME._convertFromTimestampOrString(value);
    }
    return value;
  }

  _isChanged(value: LocalTime | any, originalValue: LocalTime | any) {
    if (
      originalValue
      && !!value
      && (value === originalValue
      || (value instanceof LocalTime && originalValue instanceof LocalTime && value.compareTo(originalValue) === 0))
    ) {
      return false;
    }
    // not changed when set to same empty value
    if (!originalValue && !value && originalValue === value) {
      return false;
    }
    return true;
  }

  _stringify(date: any | string) {
    if (typeof date === 'string') {
      date = HRMTIME._convertFromTimestampOrString(date);
    }
    return date.format(DateTimeFormatter.ofPattern('HH:mm:ss'));
  }

  static parse(value: string | null): LocalTime | null {
    if (!value) return null;
    return LocalTime.parse(value, DateTimeFormatter.ofPattern('HH:mm:ss'));
  }

  types: string[];

  stringify(value: unknown): string {
    return this._stringify(value);
  }

  toSql(): string {
    return 'TIME';
  }
}
