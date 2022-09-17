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

@Table({
  tableName: 'notifications',
  underscored: true,
  timestamps: false,
})
export default class Notification extends Model {
  @PrimaryKey
  @Default(Sequelize.literal('DEFAULT'))
  @Column(DataType.UUID)
  public notificationId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public eventName!: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  public eventData!: { [key: string]: any };
}
