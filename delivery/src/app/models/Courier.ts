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
  tableName: 'couriers',
  underscored: true,
  timestamps: false,
})
export default class Courier extends Model {
  @PrimaryKey
  @Default(Sequelize.literal('DEFAULT'))
  @Column(DataType.UUID)
  public courierId!: string;

  @PrimaryKey
  @Column(DataType.STRING)
  public revision!: number;

  @AllowNull(false)
  @Column(DataType.ARRAY(DataType.JSONB))
  public slots!: Array<{ orderId: string, period: { from: string, to: string } }>;
}
