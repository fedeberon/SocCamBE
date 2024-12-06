import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../configs/database';
import Socio from './socio.models';
import AsignarCupon from './AsignarCupon.models';

class Cupon extends Model {
  public id!: number;
  public comercio!: string;
  public descripcion!: string;
  public descuento!: number;
  public fechaExpiracion!: Date;
  public codigo!: string;

  public readonly socios?: Socio[];

  public static associations: {
    socios: Association<Cupon, Socio>;
  };
}

Cupon.belongsToMany(Socio, {
  through: AsignarCupon,
  foreignKey: 'cupon_id',
  otherKey: 'socio_id',
  as: 'socios',
});

// Inicialización del modelo
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
    type: DataTypes.STRING,
    allowNull: false,
  },
  descuento: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  fechaExpiracion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  sequelize,
  modelName: 'Cupon',
  tableName: 'cupones',
  schema: 'dbo',
  timestamps: false,
});
 
export default Cupon;
