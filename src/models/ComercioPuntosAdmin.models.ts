import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class ComercioPuntosAdmin extends Model {
  public comercio_puntos_admin_id!: number;
  public comercio_id!: number;
  public socio_id!: number;
  public fecha_alta!: Date;
}

ComercioPuntosAdmin.init(
  {
    comercio_puntos_admin_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    comercio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    socio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    fecha_alta: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ComercioPuntosAdmin',
    tableName: 'comercio_puntos_admin',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['comercio_id', 'socio_id'],
        name: 'ux_comercio_puntos_admin_comercio_socio',
      },
    ],
  }
);

export default ComercioPuntosAdmin;
