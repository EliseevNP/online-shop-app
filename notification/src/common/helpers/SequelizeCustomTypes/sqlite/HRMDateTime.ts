import HRMDATETIME from '../HRMDateTime';

export interface HRMDateTimeOptions {
  isKeepTZ: boolean
}

export default class SQLITEHRMDATETIME extends HRMDATETIME {
  toSql(): string {
    return 'DATETIME';
  }
}
