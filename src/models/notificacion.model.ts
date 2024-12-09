import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class Notificacion extends Model {
  private notificacion_id!: number;
  private socio_id!: number;
  private cliente_cofre_id!: number | null; // Puede ser null si el valor es opcional
  private tipo!: string;
  private mensaje!: string;
  private fecha!: Date;
  private leida!: boolean;

  public getId(): number {
    return this.notificacion_id;
  }

  public getSocioId(): number {
    return this.socio_id;
  }

  public getClienteCofreId(): number | null {
    return this.cliente_cofre_id;
  }

  public getTipo(): string {
    return this.tipo;
  }

  public getMensaje(): string {
    return this.mensaje;
  }

  public getFecha(): Date {
    return this.fecha;
  }

  public isLeida(): boolean {
    return this.leida;
  }
}

Notificacion.init({
  notificacion_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  socio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cliente_cofre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  leida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Notificacion',
  tableName: 'notificaciones',
  schema: 'dbo',
  timestamps: false,
});

export default Notificacion;
