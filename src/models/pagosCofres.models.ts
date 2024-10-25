import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class PagosCofres extends Model {
  public pagosCofres_id!: number;
  public pagosCofres_contrato!: number;
  public pagosCofres_importe!: number;
  public pagosCofres_periodo!: number;
  public pagosCofres_anio!: number;
  public pagosCofres_fechaPago!: Date;
  public pagosCofres_estado!: string;
  public pagosCofres_deleted!: boolean;
  public pagosCofres_modificado!: Date;
  public pagosCofres_operacion!: string;
  public pagosCofres_facturaNumero!: string;
  public pagosCofres_bonificacion!: number;
  public pagosCofres_importeCuotaSocial!: number;
  public pagosCofres_depositoEnGarantia!: number;
  public pagosCofres_depositoEnGarantiaDetalle!: string;
  public pagosCofres_movimiento_cc!: number;
}

PagosCofres.init({
  pagosCofres_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  pagosCofres_contrato: DataTypes.INTEGER,
  pagosCofres_importe: DataTypes.DECIMAL(10, 2),
  pagosCofres_periodo: DataTypes.INTEGER,
  pagosCofres_anio: DataTypes.INTEGER,
  pagosCofres_fechaPago: DataTypes.DATE,
  pagosCofres_estado: DataTypes.STRING,
  pagosCofres_deleted: DataTypes.BOOLEAN,
  pagosCofres_modificado: DataTypes.DATE,
  pagosCofres_operacion: DataTypes.STRING,
  pagosCofres_facturaNumero: DataTypes.STRING,
  pagosCofres_bonificacion: DataTypes.DECIMAL(10, 2),
  pagosCofres_importeCuotaSocial: DataTypes.DECIMAL(10, 2),
  pagosCofres_depositoEnGarantia: DataTypes.DECIMAL(10, 2),
  pagosCofres_depositoEnGarantiaDetalle: DataTypes.STRING,
  pagosCofres_movimiento_cc: DataTypes.INTEGER
}, {
  sequelize,
  modelName: 'PagosCofres',
  tableName: 'pagosCofres',
  schema: 'dbo',
  timestamps: false,
});

export default PagosCofres;