import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class Categoria extends Model {
  public categoria_id!: number;
  public nombre!: string;
  public descripcion?: string;
  public deleted!: boolean;
  public creado_en!: Date;
}

Categoria.init(
  {
    categoria_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Categoria',
    tableName: 'categoria',
    schema: 'dbo',
    timestamps: false,
  }
);

export default Categoria;
