import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import CajaSeguridadTamano from './CajaSeguridadTamano.models';

class CajaSeguridad extends Model {
  public caja_id!: number;
  public numero!: string;
  public tamano_id!: number;
  public estado!: string;
  public ubicacion?: string;
  public nota?: string;
  public deleted!: boolean;
}

CajaSeguridad.init({
  caja_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  tamano_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'caja_seguridad_tamano',
      key: 'tamano_id',
    },
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'disponible',
  },
  ubicacion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  nota: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'CajaSeguridad',
  tableName: 'caja_seguridad',
  schema: 'dbo',
  timestamps: false,
});

CajaSeguridad.belongsTo(CajaSeguridadTamano, {
  foreignKey: 'tamano_id',
  as: 'tamano',
});

export default CajaSeguridad;
