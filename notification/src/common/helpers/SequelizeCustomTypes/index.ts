import {
  Utils, DataTypes, AbstractDataType, AbstractDataTypeConstructor,
} from 'sequelize';
import { DateTimeFormatter, ZonedDateTime } from '@js-joda/core';
import HRMDATETIME, { HRMDateTimeOptions } from './HRMDateTime';
import HRMTIME, { HRMTimeOptions } from './HRMTime';
import HRMDATE from './HRMDate';

type TypeExtended = AbstractDataTypeConstructor & { types: any };

interface HRMDateTimeConstructor extends TypeExtended {
  new (options?: HRMDateTimeOptions): AbstractDataType;
  (options?: HRMDateTimeOptions): AbstractDataType;
}

interface HRMDateConstructor extends TypeExtended {
  new (): AbstractDataType;
  (): AbstractDataType;
}

interface HRMTimeConstructor extends TypeExtended {
  new (options?: HRMTimeOptions): AbstractDataType;
  (options?: HRMTimeOptions): AbstractDataType;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/prefer-default-export
export const CustomType: typeof DataTypes & {
  HRMDATETIME: HRMDateTimeConstructor,
  HRMDATE: HRMDateConstructor,
  HRMTIME: HRMTimeConstructor,
} = DataTypes;

const injectCustomDataTypes = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  CustomType.HRMDATETIME = HRMDATETIME;
  CustomType.HRMDATETIME.key = 'HRMDATETIME';
  CustomType.HRMDATETIME.types = { postgres: ['timestamptz'], sqlite: ['DATETIME'] };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  CustomType.HRMDATETIME = Utils.classToInvokable(CustomType.HRMDATETIME);
  const PgTypes = (CustomType as any).postgres;
  PgTypes.HRMDATETIME = CustomType.HRMDATETIME;

  const SqliteTypes = (CustomType as any).sqlite;
  SqliteTypes.HRMDATETIME = class extends HRMDATETIME {
    toSql() {
      return 'DATETIME';
    }

    static parse(value: string | null): ZonedDateTime | null {
      if (!value) return null;
      return ZonedDateTime.parse(value, DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm:ssX'));
    }
  };
  SqliteTypes.HRMDATETIME.key = 'HRMDATETIME';
  SqliteTypes.HRMDATETIME.types = { postgres: ['timestamptz'], sqlite: ['DATETIME'] };
  SqliteTypes.HRMDATETIME = Utils.classToInvokable(SqliteTypes.HRMDATETIME);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  CustomType.HRMDATE = HRMDATE;
  CustomType.HRMDATE.key = 'HRMDATE';
  CustomType.HRMDATE.types = { postgres: ['date'], sqlite: ['DATE'] };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  CustomType.HRMDATE = Utils.classToInvokable(CustomType.HRMDATE);
  PgTypes.HRMDATE = CustomType.HRMDATE;
  SqliteTypes.HRMDATE = CustomType.HRMDATE;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  CustomType.HRMTIME = HRMTIME;
  CustomType.HRMTIME.key = 'HRMTIME';
  CustomType.HRMTIME.types = { postgres: ['time'], sqlite: ['TIME'] };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  CustomType.HRMTIME = Utils.classToInvokable(CustomType.HRMTIME);
  PgTypes.HRMTIME = CustomType.HRMTIME;
  SqliteTypes.HRMTIME = CustomType.HRMTIME;
};
injectCustomDataTypes();
