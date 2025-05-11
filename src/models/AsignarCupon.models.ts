import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Cupon from './Cupon.models';
import Socio from './socio.models';

class AsignarCupon extends Model {
  public id!: number; 
  public socio_id!: number;
  public cupon_id!: number;
}

AsignarCupon.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  socio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'socio_id',
    references: {
      model: 'socio',
      key: 'socio_id'
    },
  },
  cupon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cupon_id',
    references: {
      model: 'cupones', 
      key: 'id'
    },
  }
}, {
  sequelize,
  modelName: 'AsignarCupon',
  tableName: 'asignar_cupon',
  schema: 'dbo',
  timestamps: false,
});

AsignarCupon.belongsTo(Socio, {
  foreignKey: 'socio_id',
  as: 'socio'
});

AsignarCupon.belongsTo(Cupon, {
  foreignKey: 'cupon_id',
  as: 'cupon'
});

export default AsignarCupon;