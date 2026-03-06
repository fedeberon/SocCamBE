import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class ProductoStore extends Model {
  public producto_id!: number;
  public comercio_id!: number;
  public nombre!: string;
  public descripcion?: string;
  public precio!: number;
  public stock!: number;
  public imagen_url?: string;
  public activo!: boolean;
}

ProductoStore.init(
  {
    producto_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    comercio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    imagen_url: {
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
    modelName: 'ProductoStore',
    tableName: 'producto_store',
    schema: 'dbo',
    timestamps: false,
  }
);

export default ProductoStore;
