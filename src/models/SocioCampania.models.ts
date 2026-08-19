import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Campania from './Campania.models';
import Socio from './socio.models';

class SocioCampania extends Model {
  public socio_campania_id!: number;
  public socio_id!: number;
  public campania_id!: number;
  public estado!: 'pendiente' | 'aceptada' | 'rechazada';
  public aceptado_en?: Date;
  public notas?: string;
  public creado_en!: Date;
}

SocioCampania.init(
  {
    socio_campania_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    socio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    campania_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    aceptado_en: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notas: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SocioCampania',
    tableName: 'socio_campania',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['socio_id', 'campania_id'],
        name: 'uq_socio_campania',
      },
    ],
  }
);

SocioCampania.belongsTo(Campania, { foreignKey: 'campania_id', as: 'campania' });
SocioCampania.belongsTo(Socio, { foreignKey: 'socio_id', as: 'socio' });

export default SocioCampania;
