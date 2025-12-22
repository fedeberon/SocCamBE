import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class CajaSeguridadTamano extends Model {
  public tamano_id!: number;
  public nombre!: string;
  public descripcion?: string;
  public precio_mensual!: number;
  public precio_anual?: number;
  public activo!: boolean;
}

CajaSeguridadTamano.init({
  tamano_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  precio_mensual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  precio_anual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'CajaSeguridadTamano',
  tableName: 'caja_seguridad_tamano',
  schema: 'dbo',
  timestamps: false,
});

export default CajaSeguridadTamano;
