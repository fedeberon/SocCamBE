import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class SolicitudServicio extends Model {
  public solicitud_id!: number;
  public socio_id?: number;
  public servicio_id?: number;
  public servicio!: string;
  public nombre!: string;
  public email!: string;
  public telefono?: string;
  public comentarios?: string;
  public estado!: 'pendiente' | 'aprobada' | 'rechazada';
  public creado_en!: Date;
  public aprobado_en?: Date;
}

SolicitudServicio.init(
  {
    solicitud_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    socio_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    servicio_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    servicio: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    comentarios: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    aprobado_en: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SolicitudServicio',
    tableName: 'solicitud_servicio',
    schema: 'dbo',
    timestamps: false,
  }
);

export default SolicitudServicio;
