import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import CajaSeguridad from './CajaSeguridad.models';

class CajaPersona extends Model {
  public caja_persona_id!: number;
  public caja_id!: number;
  public tipo!: 'titular' | 'autorizado';
  public nombre!: string;
  public tipo_documento?: string;
  public numero_documento?: string;
  public cuit!: string;
  public calle?: string;
  public numero?: string;
  public piso?: string;
  public depto?: string;
  public cp?: string;
  public ciudad?: string;
  public provincia?: string;
  public telefono?: string;
  public celular?: string;
  public email?: string;
  public id_tarjeta?: string;
  public deleted!: boolean;
  public modificado_en?: Date | null;
}

CajaPersona.init({
  caja_persona_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  caja_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'caja_seguridad',
      key: 'caja_id',
    },
  },
  tipo: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  tipo_documento: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  numero_documento: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  cuit: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  calle: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  piso: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  depto: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  cp: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  provincia: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  celular: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  id_tarjeta: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  modificado_en: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'CajaPersona',
  tableName: 'caja_persona',
  schema: 'dbo',
  timestamps: false,
});

CajaPersona.belongsTo(CajaSeguridad, { foreignKey: 'caja_id', as: 'caja' });
CajaSeguridad.hasMany(CajaPersona, { foreignKey: 'caja_id', as: 'personas' });

export default CajaPersona;
