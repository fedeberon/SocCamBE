import { DataTypes, Model } from 'sequelize';
import sequelize from '../configs/database';

class SosMovimiento extends Model {}

SosMovimiento.init(
  {
    sos_mov_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    socio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sos_cobro_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    sos_cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    cuit_cuil: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    cliente_nombre: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    cliente_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    factura: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tipo_movimiento: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    comprobante_numero: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    factura_referencia: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    referencia: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    monto: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    montodebe: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    montohaber: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    periodo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    raw_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'SOS_CONTADOR',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'SosMovimiento',
    tableName: 'sos_movimientos',
    schema: 'dbo',
    timestamps: false,
  },
);

export default SosMovimiento;
