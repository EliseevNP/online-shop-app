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
  tableName: 'items',
  underscored: true,
  timestamps: false,
})
export default class Item extends Model {
  @PrimaryKey
  @Default(Sequelize.literal('DEFAULT'))
  @Column(DataType.UUID)
  public itemId!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  public stockId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public title!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public count!: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL)
  public coast!: string;
}
