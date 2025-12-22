import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Servicio from './Servicio.models';
import Socio from './socio.models';

class SocioServicio extends Model {
  public socio_servicio_id!: number;
  public socio_id!: number;
  public servicio_id!: number;
  public notas?: string;
  public contacto_nombre?: string;
  public contacto_email?: string;
  public contacto_telefono?: string;
  public creado_en!: Date;
}

SocioServicio.init({
  socio_servicio_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  socio_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  servicio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notas: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  contacto_nombre: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  contacto_email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  contacto_telefono: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  creado_en: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'SocioServicio',
  tableName: 'socio_servicio',
  schema: 'dbo',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['socio_id', 'servicio_id'],
      name: 'uq_socio_servicio',
    },
  ],
});

SocioServicio.belongsTo(Servicio, { foreignKey: 'servicio_id', as: 'servicio' });
SocioServicio.belongsTo(Socio, { foreignKey: 'socio_id', as: 'socio' });

export default SocioServicio;
