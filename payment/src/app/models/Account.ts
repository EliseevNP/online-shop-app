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
  tableName: 'accounts',
  underscored: true,
  timestamps: false,
})
export default class Account extends Model {
  @PrimaryKey
  @Default(Sequelize.literal('DEFAULT'))
  @Column(DataType.UUID)
  public accountId!: string;

  @PrimaryKey
  @Column(DataType.INTEGER)
  public revision!: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  public userId!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL)
  public amount!: string;
}
