import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class MovimientoCuentaCorrienteCofre extends Model {
  private MovimientoCuentaCorrienteCofre_id!: number;
  private MovimientoCuentaCorrienteCofre_clienteId!: number;
  private MovimientoCuentaCorrienteCofre_fechaIngreso!: Date;
  private MovimientoCuentaCorrienteCofre_tipoMovimiento!: string;
  private MovimientoCuentaCorrienteCofre_comprobanteRelacionado!: string;
  private MovimientoCuentaCorrienteCofre_importe!: number;
  private MovimientoCuentaCorrienteCofre_importeCobrar!: number;
  private MovimientoCuentaCorrienteCofre_procesado!: boolean;
  private MovimientoCuentaCorrienteCofre_deleted!: boolean;
  private MovimientoCuentaCorrienteCofre_modificado!: Date;
  private MovimientoCuentaCorrienteCofre_comprobanteTipo!: string;

  public getId(): number {
    return this.MovimientoCuentaCorrienteCofre_id;
  }

  public getClienteId(): number {
    return this.MovimientoCuentaCorrienteCofre_clienteId;
  }

  public getFechaIngreso(): Date {
    return this.MovimientoCuentaCorrienteCofre_fechaIngreso;
  }

  public getImporte(): number {
    return this.MovimientoCuentaCorrienteCofre_importe;
  }
}

MovimientoCuentaCorrienteCofre.init({
  MovimientoCuentaCorrienteCofre_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  MovimientoCuentaCorrienteCofre_clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  MovimientoCuentaCorrienteCofre_fechaIngreso: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  MovimientoCuentaCorrienteCofre_tipoMovimiento: DataTypes.STRING,
  MovimientoCuentaCorrienteCofre_comprobanteRelacionado: DataTypes.STRING,
  MovimientoCuentaCorrienteCofre_importe: DataTypes.DECIMAL(10, 2),
  MovimientoCuentaCorrienteCofre_importeCobrar: DataTypes.DECIMAL(10, 2),
  MovimientoCuentaCorrienteCofre_procesado: DataTypes.BOOLEAN,
  MovimientoCuentaCorrienteCofre_deleted: DataTypes.BOOLEAN,
  MovimientoCuentaCorrienteCofre_modificado: DataTypes.DATE,
  MovimientoCuentaCorrienteCofre_comprobanteTipo: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'MovimientoCuentaCorrienteCofre',
  tableName: 'MovimientoCuentaCorrienteCofre',
  schema: 'dbo',
  timestamps: false,
});

export default MovimientoCuentaCorrienteCofre;