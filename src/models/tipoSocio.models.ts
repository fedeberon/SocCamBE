// models/TipoSocio.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';


class TipoSocio extends Model {
  public tipoSocio_id!: number;
  public tipoSocio_tipo!: number;
  public tipoSocio_nombre!: string;
  public tipoSocio_importe!: number;
  public tipoSocio_periodicidad!: number;
  public tipoSocio_deleted!: boolean;
  public tipoSocio_modificado!: Date;
}

TipoSocio.init({
  tipoSocio_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipoSocio_tipo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipoSocio_nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipoSocio_importe: {
    type: DataTypes.DECIMAL(25, 13),
    allowNull: false,
  },
  tipoSocio_periodicidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipoSocio_deleted: {
    type: DataTypes.BOOLEAN
  },
  tipoSocio_modificado: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'TipoSocio',
  tableName: 'tipoSocio',
  schema: 'dbo',
  timestamps: false,
});


export default TipoSocio;
