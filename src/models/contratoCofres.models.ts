import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';
import Socio from './socio.models';
import CajaSeguridad from './CajaSeguridad.models';

class ContratoCofres extends Model {
  public contratoCofres_id!: number;
  public contratoCofres_esSocioId!: number;
  public contratoCofres_nombre!: string;
  public contratoCofres_dni?: string | null;
  public contratoCofres_domicilioFiscal?: string | null;
  public contratoCofres_cajaId?: number | null;
  public contratoCofres_cajaNumero?: string | null;
  public contratoCofres_cofreNumero?: number | null;
  public contratoCofres_estado!: string;
  public contratoCofres_fechaContratacion!: string;
  public contratoCofres_fechaVencimiento?: string | null;
  public contratoCofres_firmaDigital?: string | null;
  public contratoCofres_firmante?: string | null;
  public contratoCofres_fechaFirma?: Date | null;
  public contratoCofres_modificado?: Date | null;
}

ContratoCofres.init({
  contratoCofres_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  contratoCofres_esSocioId: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  contratoCofres_nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  contratoCofres_dni: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  contratoCofres_domicilioFiscal: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  contratoCofres_cajaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  contratoCofres_cajaNumero: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  contratoCofres_cofreNumero: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  contratoCofres_estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pendiente de firma',
  },
  contratoCofres_fechaContratacion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  contratoCofres_fechaVencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  contratoCofres_firmaDigital: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contratoCofres_firmante: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  contratoCofres_fechaFirma: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  contratoCofres_modificado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'ContratoCofres',
  tableName: 'contratoCofres',
  schema: 'dbo',
  timestamps: false,
});

if ((Socio as any)?.prototype instanceof Model) {
  ContratoCofres.belongsTo(Socio, { foreignKey: 'contratoCofres_esSocioId', as: 'socio' });
}
if ((CajaSeguridad as any)?.prototype instanceof Model) {
  ContratoCofres.belongsTo(CajaSeguridad, { foreignKey: 'contratoCofres_cajaId', as: 'caja' });
}

export default ContratoCofres;
