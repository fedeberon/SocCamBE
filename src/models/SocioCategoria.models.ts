import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Categoria from './Categoria.models';
import Socio from './socio.models';

class SocioCategoria extends Model {
  public socio_categoria_id!: number;
  public socio_id!: number;
  public categoria_id!: number;
  public creado_en!: Date;
}

SocioCategoria.init(
  {
    socio_categoria_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    socio_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SocioCategoria',
    tableName: 'socio_categoria',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['socio_id', 'categoria_id'],
        name: 'uq_socio_categoria',
      },
    ],
  }
);

SocioCategoria.belongsTo(Categoria, {
  foreignKey: 'categoria_id',
  as: 'categoria',
});
SocioCategoria.belongsTo(Socio, { foreignKey: 'socio_id', as: 'socio' });

export default SocioCategoria;
