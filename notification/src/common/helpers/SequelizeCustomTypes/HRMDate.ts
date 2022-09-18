import {
  ZoneOffset, LocalDateTime, DateTimeFormatter, LocalDate,
} from '@js-joda/core';
import { DataTypes } from 'sequelize';
import { parseDate } from '../date-utils';

const ABSTRACT = (DataTypes.ABSTRACT as any).prototype.constructor;

export default class HRMDATE extends ABSTRACT {
  key: string;

  constructor() {
    super();
    this.key = 'HRMDATE';
  }

  static _convertFromTimestampOrString(date: number | string): LocalDate | null {
    return typeof date === 'string'
      ? parseDate(date)
      : LocalDateTime.ofEpochSecond(date, ZoneOffset.UTC).toLocalDate();
  }

  _sanitize(value: string | number | LocalDate, options: { raw: any }) {
    if ((!options || (options && !options.raw))
      && !(value instanceof LocalDate) && !!value) {
      return HRMDATE._convertFromTimestampOrString(value);
    }
    return value;
  }

  _isChanged(value: LocalDate | any, originalValue: LocalDate | any) {
    if (
      originalValue
      && !!value
      && (value === originalValue
      || (value instanceof LocalDate && originalValue instanceof LocalDate && value.compareTo(originalValue) === 0))
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
      date = HRMDATE._convertFromTimestampOrString(date);
    }
    return date.format(DateTimeFormatter.ofPattern('yyyy-MM-dd'));
  }

  static parse(value: string | null): LocalDate | null {
    if (!value) return null;
    return LocalDate.parse(value, DateTimeFormatter.ofPattern('yyyy-MM-dd'));
  }

  types: string[];

  stringify(value: unknown): string {
    return this._stringify(value);
  }

  toSql(): string {
    return 'DATE';
  }
}
