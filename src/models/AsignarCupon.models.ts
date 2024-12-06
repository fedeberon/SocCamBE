import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database'; // Asegúrate de usar la misma instancia

class AsignarCupon extends Model {}

AsignarCupon.init(
  {
    socio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    cupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'AsignarCupon',
    tableName: 'asignar_cupon',
    schema: 'dbo',
    timestamps: false,
  }
);

export default AsignarCupon;
