import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class ComercioPuntos extends Model {
  public comercio_id!: number;
  public nombre!: string;
  public activo!: boolean;
  public puntos_por_carga!: number;
  public logo_url?: string;
}

ComercioPuntos.init(
  {
    comercio_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    puntos_por_carga: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ComercioPuntos',
    tableName: 'comercio_puntos',
    schema: 'dbo',
    timestamps: false,
  }
);

export default ComercioPuntos;
