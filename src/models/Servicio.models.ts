import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class Servicio extends Model {
  public servicio_id!: number;
  public nombre!: string;
  public descripcion?: string;
  public categoria?: string;
  public activo!: boolean;
  public creado_en!: Date;
}

Servicio.init({
  servicio_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  creado_en: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Servicio',
  tableName: 'servicio',
  schema: 'dbo',
  timestamps: false,
});

export default Servicio;
