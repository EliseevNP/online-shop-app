import { ZonedDateTime } from '@js-joda/core';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  Sequelize,
  PrimaryKey,
  Table,
  Model,
} from 'sequelize-typescript';
import { CustomType } from '../../common/helpers/SequelizeCustomTypes';

@Table({
  tableName: 'notifications',
  underscored: true,
  timestamps: true,
})
export default class Notification extends Model {
  @PrimaryKey
  @Default(Sequelize.literal('DEFAULT'))
  @Column(DataType.UUID)
  public notificationId!: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  public userId!: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  public eventName!: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  public eventData!: { [key: string]: any };

  @AllowNull(true)
  @Column(CustomType.HRMDATETIME)
  createdAt: ZonedDateTime;

  @AllowNull(true)
  @Column(CustomType.HRMDATETIME)
  updatedAt: ZonedDateTime;
}
