import {
  DateTimeFormatter, LocalDate, LocalTime, ZonedDateTime,
} from '@js-joda/core';

const DATETIME_FORMAT = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
const PG_DATETIME_FORMAT = DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm:ssx');
const DATE_FORMAT = DateTimeFormatter.ofPattern('yyyy-MM-dd');
const PG_DATE_FORMAT = DateTimeFormatter.ofPattern('yyyy-MM-dd');
const TIME_FORMAT = DateTimeFormatter.ofPattern('HH:mm:ss');
const PG_TIME_FORMAT = DateTimeFormatter.ofPattern('HH:mm:ss');

export const parseDateTime = (value: string | null): ZonedDateTime | null => {
  if (value === null) return null;
  return ZonedDateTime.parse(value);
};

export const parseDate = (value: string | null): LocalDate | null => {
  if (value === null) return null;
  return LocalDate.parse(value, DATE_FORMAT);
};

export const parseTime = (value: string | null): LocalTime | null => {
  if (value === null) return null;
  return LocalTime.parse(value, TIME_FORMAT);
};

export const stringifyDateTime = (value: ZonedDateTime): string => value.format(DATETIME_FORMAT);
export const stringifyDate = (value: LocalDate): string => value.format(DATE_FORMAT);
export const stringifyTime = (value: LocalTime): string => value.format(TIME_FORMAT);

export const pgStringifyDateTime = (value: ZonedDateTime): string => value.format(PG_DATETIME_FORMAT);
export const pgStringifyDate = (value: LocalDate): string => value.format(PG_DATE_FORMAT);
export const pgStringifyTime = (value: LocalTime): string => value.format(PG_TIME_FORMAT);
