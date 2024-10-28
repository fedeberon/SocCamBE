import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class AcontecimientoCategoria extends Model {
  public categoria_id!: number;
  public nombre!: string;
}

AcontecimientoCategoria.init({
  categoria_id: {
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
  modelName: 'AcontecimientoCategoria',
  tableName: 'acontecimiento_categoria',
  schema: 'dbo',
  timestamps: false,
});

export default AcontecimientoCategoria;