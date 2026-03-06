import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class ComercioStore extends Model {
  public comercio_id!: number;
  public socio_id!: number;
  public nombre!: string;
  public slug!: string;
  public descripcion?: string;
  public logo_url?: string;
  public activo!: boolean;
}

ComercioStore.init(
  {
    comercio_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    socio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'ComercioStore',
    tableName: 'comercio_store',
    schema: 'dbo',
    timestamps: false,
  }
);

export default ComercioStore;
