import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class AcontecimientoSocio extends Model {
  public acontecimiento_id!: number;
  public socio_id!: number;
}

AcontecimientoSocio.init({
  acontecimiento_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  socio_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
}, {
  sequelize,
  modelName: 'AcontecimientoSocio',
  tableName: 'acontecimiento_socio',
  schema: 'dbo',
  timestamps: false,
});

export default AcontecimientoSocio;