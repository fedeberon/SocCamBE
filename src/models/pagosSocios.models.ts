import { Model, DataTypes, BelongsToGetAssociationMixin } from 'sequelize';
import sequelize from '../configs/database';

class PagosSocios extends Model {
  private pagosSocios_id!: number;
  private pagosSocios_socio!: number;
  private pagosSocios_plan!: string;
  private pagosSocios_anio!: number;
  private pagosSocios_periodo!: number;
  private pagosSocios_periodicidad!: string;
  private pagosSocios_fechaVencimiento!: Date;
  private pagosSocios_fechaPago!: Date;
  private pagosSocios_observaciones!: string;
  private pagosSocios_estado!: string;
  private pagosSocios_cobrador!: string;
  private pagosSocios_monto!: number;
  private pagosSocios_deleted!: boolean;
  private pagosSocios_modificado!: Date;
  private pagosSocios_crx_fechaVencimiento!: Date;
  private pagosSocios_crx_fechaPago!: Date;
  private pagosSocios_operacion!: string;
  private recibo_id!: number;
  private pagosSocios_movimiento_cc!: number;
  private pagosSocios_bonificacion!: number;

  public getId(): number { return this.pagosSocios_id; }
  public getSocio(): number { return this.pagosSocios_socio; }
  public getPlan(): string { return this.pagosSocios_plan; }

}

PagosSocios.init({
  pagosSocios_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  pagosSocios_socio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pagosSocios_plan: DataTypes.STRING,
  pagosSocios_anio: DataTypes.INTEGER,
  pagosSocios_periodo: DataTypes.INTEGER,
  pagosSocios_periodicidad: DataTypes.STRING,
  pagosSocios_fechaVencimiento: DataTypes.DATE,
  pagosSocios_fechaPago: DataTypes.DATE,
  pagosSocios_observaciones: DataTypes.STRING,
  pagosSocios_estado: DataTypes.STRING,
  pagosSocios_cobrador: DataTypes.STRING,
  pagosSocios_monto: DataTypes.DECIMAL(10, 2),
  pagosSocios_deleted: DataTypes.BOOLEAN,
  pagosSocios_modificado: DataTypes.DATE,
  pagosSocios_crx_fechaVencimiento: DataTypes.DATE,
  pagosSocios_crx_fechaPago: DataTypes.DATE,
  pagosSocios_operacion: DataTypes.STRING,
  recibo_id: DataTypes.INTEGER,
  pagosSocios_movimiento_cc: DataTypes.INTEGER,
  pagosSocios_bonificacion: DataTypes.DECIMAL(10, 2),
}, {
  sequelize,
  modelName: 'PagosSocios',
  tableName: 'pagosSocios',
  schema: 'dbo',
  timestamps: false,
});


export default PagosSocios;