import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class AcontecimientoUbicacion extends Model {
  public ubicacion_id!: number;
  public nombre!: string;
}

AcontecimientoUbicacion.init({
  ubicacion_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'AcontecimientoUbicacion',
  tableName: 'acontecimiento_ubicacion',
  schema: 'dbo',
  timestamps: false,
});

export default AcontecimientoUbicacion;