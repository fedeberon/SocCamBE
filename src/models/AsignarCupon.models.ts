import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Cupon from './cupon.models';

class AsignarCupon extends Model {
  public socio_id!: number;
  public cupon_id!: number;
}

AsignarCupon.init({
  socio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'socios',
      key: 'id',
    },
  },
  cupon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cupones',
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'AsignarCupon',
  tableName: 'asignar_cupon',
  schema: 'dbo',
  timestamps: false,
});

AsignarCupon.belongsTo(Cupon, {
  foreignKey: 'cupon_id',
  as: 'cupon',
});

export default AsignarCupon;
