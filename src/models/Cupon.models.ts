import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class Cupon extends Model {
  public id!: number;
  public comercio!: string;
  public descripcion!: string;
  public descuento!: number;
  public fechaExpiracion!: Date;
  public codigo!: string;
  public utilizado!: boolean;
  public deleted!: boolean;

  public markAsUsed(): void {
    this.utilizado = true;
  }

  public markAsDeleted(): void {
    this.deleted = true;
  }
}

Cupon.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  comercio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  descuento: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  fechaExpiracion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  utilizado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Cupon',
  tableName: 'cupones',
  schema: 'dbo',
  timestamps: false,
});

export default Cupon;
