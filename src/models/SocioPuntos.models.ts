import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Socio from './socio.models';

class SocioPuntos extends Model {
  public socio_puntos_id!: number;
  public socio_id!: number;
  public comercio!: string;
  public comercio_id?: number;
  public puntos!: number;
  public fecha_carga!: Date;
  public qr_payload?: string;
}

SocioPuntos.init(
  {
    socio_puntos_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    socio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    comercio: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    comercio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    puntos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fecha_carga: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    qr_payload: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SocioPuntos',
    tableName: 'socio_puntos',
    schema: 'dbo',
    timestamps: false,
  }
);

SocioPuntos.belongsTo(Socio, { foreignKey: 'socio_id', as: 'socio' });

export default SocioPuntos;
