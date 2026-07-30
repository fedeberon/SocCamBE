import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class CuponUso extends Model {
  public id!: number;
  public socio_id!: number;
  public socio_email!: string;
  public socio_nombre!: string;
  public cupon_id!: number;
  public cupon_codigo!: string;
  public cupon_comercio!: string;
  public cupon_descuento!: number;
  public fecha_uso!: Date;
}

CuponUso.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  socio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'socio_id',
    references: {
      model: 'socio',
      key: 'socio_id',
    },
  },
  socio_email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'socio_email',
  },
  socio_nombre: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'socio_nombre',
  },
  cupon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cupon_id',
    references: {
      model: 'cupones',
      key: 'id',
    },
  },
  cupon_codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'cupon_codigo',
  },
  cupon_comercio: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'cupon_comercio',
  },
  cupon_descuento: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'cupon_descuento',
  },
  fecha_uso: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_uso',
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'CuponUso',
  tableName: 'cupon_uso',
  schema: 'dbo',
  timestamps: false,
});

export default CuponUso;
