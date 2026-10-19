import { Model, DataTypes, Association, HasManyGetAssociationsMixin } from 'sequelize';
import sequelize from '../configs/database';
import AcontecimientoUbicacion from './acontecimientoUbicacion.models';
import AcontecimientoCategoria from './acontecimientoCategoria.models';
import Socio from './socio.models';
import AcontecimientoSocio from './acontecimientoSocio.models';

const pad = (n: number) => String(n).padStart(2, '0');

function formatearFechaLocal(valor: any): any {
  if (valor == null || valor === '') return valor;
  if (valor instanceof Date) {
    return `${valor.getUTCFullYear()}-${pad(valor.getUTCMonth() + 1)}-${pad(valor.getUTCDate())}T${pad(valor.getUTCHours())}:${pad(valor.getUTCMinutes())}:${pad(valor.getUTCSeconds())}`;
  }
  const texto = String(valor);
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(texto);
  if (!match) return texto;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] || '00'}`;
}

class Acontecimiento extends Model {
  public acontecimiento_id!: number;
  public nombre!: string;
  public categoria_id!: number;
  public deleted!: boolean;
  public modificado!: string;
  public ubicacion_id!: number;
  public fecha!: string;
  public fecha_fin?: string | null;
  public estado!: 'borrador' | 'publicado' | 'en_curso' | 'finalizado' | 'cancelado';
  public cupo?: number | null;
  public imagen_url?: string | null;
  public creado_en?: string;
  public descripcion!: string;
  public ruta_archivo!: string;

  // Declaración de asociaciones
  public readonly ubicacion?: AcontecimientoUbicacion;
  public readonly categoria?: AcontecimientoCategoria;
  public readonly socios?: Socio[];

  public static associations: {
    ubicacion: Association<Acontecimiento, AcontecimientoUbicacion>;
    categoria: Association<AcontecimientoCategoria>;
    socios: Association<Acontecimiento, Socio>;
  };
}

Acontecimiento.init({
  acontecimiento_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  modificado: {
    type: DataTypes.STRING(30),
    defaultValue: DataTypes.NOW,
    get(this: any) { return formatearFechaLocal(this.getDataValue('modificado')); },
  },
  ubicacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.STRING(30),
    allowNull: false,
    get(this: any) { return formatearFechaLocal(this.getDataValue('fecha')); },
  },
  fecha_fin: {
    type: DataTypes.STRING(30),
    allowNull: true,
    get(this: any) { return formatearFechaLocal(this.getDataValue('fecha_fin')); },
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'borrador',
  },
  cupo: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  imagen_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  creado_en: {
    type: DataTypes.STRING(30),
    allowNull: true,
    get(this: any) { return formatearFechaLocal(this.getDataValue('creado_en')); },
  },
  descripcion: DataTypes.TEXT,
  ruta_archivo: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'Acontecimiento',
  tableName: 'acontecimientos',
  schema: 'dbo',
  timestamps: false,
  hasTrigger: true,
});

Acontecimiento.belongsTo(AcontecimientoUbicacion, {
  foreignKey: 'ubicacion_id',
  as: 'ubicacion'
});

Acontecimiento.belongsTo(AcontecimientoCategoria, {
  foreignKey: 'categoria_id',
  as: 'categoria'
});

Acontecimiento.belongsToMany(Socio, {
  through: AcontecimientoSocio,
  foreignKey: 'acontecimiento_id',
  otherKey: 'socio_id',
  as: 'socios'
});


export default Acontecimiento;