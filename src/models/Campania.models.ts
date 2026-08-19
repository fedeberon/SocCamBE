import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class Campania extends Model {
  public campania_id!: number;
  public nombre!: string;
  public descripcion?: string;
  public logo_url?: string;
  public imagen_url?: string;
  public fecha_inicio!: Date;
  public fecha_fin!: Date;
  public estado!: 'borrador' | 'activa' | 'finalizada' | 'cancelada';
  public descuento?: string;
  public terminos?: string;
  public creado_en!: Date;
  public modificado_en?: Date;
}

Campania.init(
  {
    campania_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    imagen_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'borrador',
    },
    descuento: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    terminos: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modificado_en: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Campania',
    tableName: 'campania',
    schema: 'dbo',
    timestamps: false,
  }
);

export default Campania;
