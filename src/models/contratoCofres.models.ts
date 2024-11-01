import { Model, DataTypes } from 'sequelize';
import sequelize from '../configs/database';

class ContratoCofres extends Model {
  public contratoCofres_id!: number;
  public contratoCofres_tipo!: string;
  public contratoCofres_numero!: number;
  public contratoCofres_esSocioId!: number;
  public contratoCofres_cofreLetra!: string;
  public contratoCofres_cofreNumero!: number;
  public contratoCofres_cofreTipo!: string;
  public contratoCofres_nombre!: string;
  public contratoCofres_modalidad!: string;
  public contratoCofres_conjunta1!: string;
  public contratoCofres_conjunta2!: string;
  public contratoCofres_conjunta3!: string;
  public contratoCofres_fechaContratacion!: Date;
  public contratoCofres_fechaVencimiento!: Date;
  public contratoCofres_estado!: string;
  public contratoCofres_recibirInfo!: boolean;
  public contratoCofres_contactoCalle!: string;
  public contratoCofres_contactoCalleNum!: string;
  public contratoCofres_contactoCallePiso!: string;
  public contratoCofres_contactoCalleDepto!: string;
  public contratoCofres_contactoCP!: string;
  public contratoCofres_contactoCiudad!: string;
  public contratoCofres_contactoProvincia!: string;
  public contratoCofres_contactoTel!: string;
  public contratoCofres_contactoCel!: string;
  public contratoCofres_contactoMail!: string;
  public contratoCofres_deleted!: boolean;
  public contratoCofres_modificado!: Date;
  public contratoCofres_cuitFacturacion!: string;
  public contratoCofres_factRazonSocial!: string;
  public contratoCofres_factLocalidad!: string;
  public contratoCofres_factDomicilio!: string;
  public contratoCofres_factProvincia!: string;
  public contratoCofres_factCF!: string;
}

ContratoCofres.init({
  contratoCofres_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  contratoCofres_tipo: DataTypes.STRING,
  contratoCofres_numero: DataTypes.INTEGER,
  contratoCofres_esSocioId: DataTypes.INTEGER,
  contratoCofres_cofreLetra: DataTypes.STRING,
  contratoCofres_cofreNumero: DataTypes.INTEGER,
  contratoCofres_cofreTipo: DataTypes.STRING,
  contratoCofres_nombre: DataTypes.STRING,
  contratoCofres_modalidad: DataTypes.STRING,
  contratoCofres_conjunta1: DataTypes.STRING,
  contratoCofres_conjunta2: DataTypes.STRING,
  contratoCofres_conjunta3: DataTypes.STRING,
  contratoCofres_fechaContratacion: DataTypes.DATE,
  contratoCofres_fechaVencimiento: DataTypes.DATE,
  contratoCofres_estado: DataTypes.STRING,
  contratoCofres_recibirInfo: DataTypes.BOOLEAN,
  contratoCofres_contactoCalle: DataTypes.STRING,
  contratoCofres_contactoCalleNum: DataTypes.STRING,
  contratoCofres_contactoCallePiso: DataTypes.STRING,
  contratoCofres_contactoCalleDepto: DataTypes.STRING,
  contratoCofres_contactoCP: DataTypes.STRING,
  contratoCofres_contactoCiudad: DataTypes.STRING,
  contratoCofres_contactoProvincia: DataTypes.STRING,
  contratoCofres_contactoTel: DataTypes.STRING,
  contratoCofres_contactoCel: DataTypes.STRING,
  contratoCofres_contactoMail: DataTypes.STRING,
  contratoCofres_deleted: DataTypes.BOOLEAN,
  contratoCofres_modificado: DataTypes.DATE,
  contratoCofres_cuitFacturacion: DataTypes.STRING,
  contratoCofres_factRazonSocial: DataTypes.STRING,
  contratoCofres_factLocalidad: DataTypes.STRING,
  contratoCofres_factDomicilio: DataTypes.STRING,
  contratoCofres_factProvincia: DataTypes.STRING,
  contratoCofres_factCF: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'ContratoCofres',
  tableName: 'contratoCofres',
  schema: 'dbo',
  timestamps: false,
});

export default ContratoCofres;