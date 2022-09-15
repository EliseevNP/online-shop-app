import {
  AllowNull,
  Column,
  DataType,
  Default,
  Sequelize,
  PrimaryKey,
  Table,
  Model,
  HasMany,
  DefaultScope,
} from 'sequelize-typescript';
import Item from './Item';

@DefaultScope(() => ({
  include: [{
    model: Item,
  }]
}))
@Table({
  tableName: 'stocks',
  underscored: true,
  timestamps: false,
})
export default class Stock extends Model {
  @PrimaryKey
  @Default(Sequelize.literal('DEFAULT'))
  @Column(DataType.UUID)
  public stockId!: string;

  @PrimaryKey
  @Column(DataType.STRING)
  public revision!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public title!: string;

  @HasMany(() => Item, {
    constraints: false,
    foreignKey: 'stockId',
    sourceKey: 'stockId',
  })
  items: Item[];
}
