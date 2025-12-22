import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Socio from './socio.models';
import CajaSeguridad from './CajaSeguridad.models';

class SocioCajaSeguridad extends Model {
  public socio_caja_id!: number;
  public socio_id!: number;
  public caja_id!: number;
  public es_titular!: boolean;
  public fecha_inicio!: Date;
  public fecha_fin?: Date | null;
  public nota?: string;
}

SocioCajaSeguridad.init({
  socio_caja_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  socio_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'socio',
      key: 'socio_id',
    },
  },
  caja_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'caja_seguridad',
      key: 'caja_id',
    },
  },
  es_titular: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nota: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'SocioCajaSeguridad',
  tableName: 'socio_caja_seguridad',
  schema: 'dbo',
  timestamps: false,
});

SocioCajaSeguridad.belongsTo(Socio, { foreignKey: 'socio_id', as: 'socio' });
SocioCajaSeguridad.belongsTo(CajaSeguridad, { foreignKey: 'caja_id', as: 'caja' });

Socio.belongsToMany(CajaSeguridad, {
  through: SocioCajaSeguridad,
  foreignKey: 'socio_id',
  otherKey: 'caja_id',
  as: 'cajasSeguridad',
});

CajaSeguridad.belongsToMany(Socio, {
  through: SocioCajaSeguridad,
  foreignKey: 'caja_id',
  otherKey: 'socio_id',
  as: 'socios',
});

export default SocioCajaSeguridad;
