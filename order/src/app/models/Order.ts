import {
  AllowNull,
  Column,
  DataType,
  Default,
  Sequelize,
  PrimaryKey,
  Table,
  Model,
  DefaultScope,
} from 'sequelize-typescript';
import { ZonedDateTime } from '@js-joda/core';
import { EOrderStates } from '../enums/EOrderStates';

@DefaultScope(() => ({
  where: {
    state: EOrderStates.CREATED,
  }
}))
@Table({
  tableName: 'orders',
  underscored: true,
  timestamps: false,
})
export default class Order extends Model {
  @PrimaryKey
  @Default(Sequelize.literal('DEFAULT'))
  @Column(DataType.UUID)
  public orderId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public state!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public revision!: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  public userId!: string;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.JSONB))
  public itemsInfo!: Array<{ itemId: string, count: number }>;

  @AllowNull(false)
  @Column(DataType.JSONB)
  public deliveryInfo!: { courierId: string | null, period: { from: ZonedDateTime, to: ZonedDateTime } };
}
