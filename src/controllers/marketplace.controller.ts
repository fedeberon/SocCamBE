import { Request, Response } from 'express';
import logger from '../configs/logger';
import ComercioStore from '../models/ComercioStore.models';
import ProductoStore from '../models/ProductoStore.models';
import ComercioPuntos from '../models/ComercioPuntos.models';
import azureBlobService from '../service/azureBlob.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const slugify = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 180);

class MarketplaceController {
  private static encodeEmprendedorMeta(meta: {
    nombreMarca: string;
    rubro: string;
    telefono: string;
    whatsapp?: string;
    bio?: string;
    estado?: 'informal' | 'en_formalizacion' | 'formalizado';
    cuenta?: { email: string; passwordHash: string };
    acompanamiento?: { solicitado?: boolean; arca?: boolean; nota?: string; updatedAt?: string };
  }) {
    return JSON.stringify({
      tipo: 'emprendedor',
      nombreMarca: String(meta.nombreMarca || '').trim(),
      rubro: String(meta.rubro || '').trim(),
      telefono: String(meta.telefono || '').trim(),
      whatsapp: String(meta.whatsapp || '').trim() || undefined,
      bio: String(meta.bio || '').trim() || undefined,
      estado: meta.estado || 'informal',
      cuenta: meta.cuenta,
      acompanamiento: meta.acompanamiento,
    });
  }

  private static parseEmprendedorMeta(descripcion?: string | null) {
    if (!descripcion) return null;
    try {
      const obj = JSON.parse(String(descripcion));
      if (obj?.tipo === 'emprendedor') return obj;
      return null;
    } catch {
      return null;
    }
  }

  private static getEmprendedorSecret() {
    return process.env.EMPRENDEDOR_JWT_SECRET || process.env.JWT_SECRET || 'soccam-emprendedor-dev-secret';
  }

  private static signEmprendedorToken(payload: { comercio_id: number; email: string }) {
    return jwt.sign(payload, MarketplaceController.getEmprendedorSecret(), { expiresIn: '7d' });
  }

  private static verifyEmprendedorToken(token: string): { comercio_id: number; email: string } | null {
    try {
      return jwt.verify(token, MarketplaceController.getEmprendedorSecret()) as any;
    } catch {
      return null;
    }
  }

  private static buildProductoImagenUrl(producto: any) {
    const raw = producto?.get ? producto.get('imagen_url') : producto?.imagen_url;
    if (!raw) return null;
    try {
      return azureBlobService.getReadOnlyUrl(String(raw));
    } catch {
      return String(raw);
    }
  }

  private static buildComercioLogoUrl(comercio: any) {
    const raw = comercio?.get ? comercio.get('logo_url') : comercio?.logo_url;
    if (!raw) return null;
    try {
      return azureBlobService.getReadOnlyUrl(String(raw));
    } catch {
      return String(raw);
    }
  }

  private static mapComercio(item: any) {
    const plain = item?.toJSON ? item.toJSON() : { ...(item || {}) };
    const emprendedor = MarketplaceController.parseEmprendedorMeta(plain.descripcion);
    return {
      ...plain,
      logo_url: MarketplaceController.buildComercioLogoUrl(item),
      emprendedor,
      es_emprendedor: Boolean(emprendedor),
    };
  }

  private static mapProducto(item: any) {
    const plain = item?.toJSON ? item.toJSON() : { ...(item || {}) };
    return {
      ...plain,
      imagen_url: MarketplaceController.buildProductoImagenUrl(item),
    };
  }

  static async listComercios(_req: Request, res: Response) {
    try {
      const items = await ComercioStore.findAll({ where: { activo: true } as any, order: [['nombre', 'ASC']] });
      const puntos = await ComercioPuntos.findAll({ where: { activo: true } as any });
      const puntosByNombre = new Map<string, any>();
      for (const p of puntos as any[]) {
        const nombre = String(p?.get ? p.get('nombre') : p?.nombre || '').trim().toLowerCase();
        if (nombre && !puntosByNombre.has(nombre)) puntosByNombre.set(nombre, p);
      }

      const mapped = items.map((item: any) => {
        const plain = item?.toJSON ? item.toJSON() : { ...(item || {}) };
        const storeLogo = plain.logo_url || null;
        if (storeLogo) return MarketplaceController.mapComercio(item);

        const nombre = String(plain.nombre || '').trim().toLowerCase();
        const match = nombre ? puntosByNombre.get(nombre) : null;
        const logoFallback = match ? MarketplaceController.buildComercioLogoUrl(match) : null;
        return { ...plain, logo_url: logoFallback };
      });

      return res.status(200).json(mapped);
    } catch (error) {
      logger.error('Error listando comercios marketplace', error);
      return res.status(500).json({ message: 'Error listando comercios' });
    }
  }

  static async getComercioBySlug(req: Request, res: Response) {
    try {
      const slug = String(req.params.slug || '').trim().toLowerCase();
      const comercio = await ComercioStore.findOne({ where: { slug, activo: true } as any });
      if (!comercio) return res.status(404).json({ message: 'Comercio no encontrado' });

      const mapped = MarketplaceController.mapComercio(comercio) as any;
      if (!mapped.logo_url) {
        const nombre = String(mapped.nombre || '').trim();
        if (nombre) {
          const punto = await ComercioPuntos.findOne({ where: { nombre } as any });
          if (punto) mapped.logo_url = MarketplaceController.buildComercioLogoUrl(punto);
        }
      }

      return res.status(200).json(mapped);
    } catch (error) {
      logger.error('Error obteniendo comercio por slug', error);
      return res.status(500).json({ message: 'Error obteniendo comercio' });
    }
  }

  static async createComercio(req: Request, res: Response) {
    try {
      const body: any = req.body || {};
      const nombre = String(body.nombre || '').trim();
      const socio_id = Number(body.socio_id);
      if (!nombre || !Number.isFinite(socio_id)) return res.status(400).json({ message: 'nombre y socio_id son requeridos' });

      let slug = slugify(body.slug || nombre);
      if (!slug) slug = `comercio-${Date.now()}`;
      const exists = await ComercioStore.findOne({ where: { slug } as any });
      if (exists) slug = `${slug}-${Date.now().toString().slice(-5)}`;

      const created = await ComercioStore.create({
        socio_id,
        nombre,
        slug,
        descripcion: body.descripcion ? String(body.descripcion).slice(0, 500) : null,
        logo_url: body.logo_url || null,
        activo: body.activo !== false,
      } as any);
      return res.status(201).json(MarketplaceController.mapComercio(created));
    } catch (error) {
      logger.error('Error creando comercio marketplace', error);
      return res.status(500).json({ message: 'Error creando comercio' });
    }
  }

  static async updateComercio(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'ID inválido' });
      const item = await ComercioStore.findByPk(id);
      if (!item) return res.status(404).json({ message: 'Comercio no encontrado' });

      const body: any = req.body || {};
      if (body.nombre !== undefined) item.set('nombre', String(body.nombre || '').trim());
      if (body.descripcion !== undefined) item.set('descripcion', body.descripcion ? String(body.descripcion).slice(0, 500) : null);
      if (body.logo_url !== undefined) item.set('logo_url', body.logo_url || null);
      if (body.activo !== undefined) item.set('activo', Boolean(body.activo));
      if (body.slug !== undefined) item.set('slug', slugify(body.slug));

      await item.save();
      return res.status(200).json(MarketplaceController.mapComercio(item));
    } catch (error) {
      logger.error('Error actualizando comercio marketplace', error);
      return res.status(500).json({ message: 'Error actualizando comercio' });
    }
  }

  static async deleteComercio(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'ID inválido' });
      const item: any = await ComercioStore.findByPk(id);
      if (!item) return res.status(404).json({ message: 'Comercio no encontrado' });

      const productosEliminados = await ProductoStore.destroy({ where: { comercio_id: id } as any });
      await item.destroy();

      return res.status(200).json({ ok: true, comercio_id: id, deleted: true, productos_eliminados: productosEliminados });
    } catch (error) {
      logger.error('Error eliminando comercio marketplace', error);
      return res.status(500).json({ message: 'Error eliminando comercio' });
    }
  }

  static async listComerciosAdmin(req: Request, res: Response) {
    try {
      const includeInactivos = String((req.query as any)?.include_inactivos || '').trim() === '1';
      const where: any = includeInactivos ? {} : { activo: true };
      const items = await ComercioStore.findAll({ where, order: [['comercio_id', 'DESC']] });
      const productos = await ProductoStore.findAll({ where: {} as any, attributes: ['comercio_id', 'activo'] as any });

      const countByComercio = new Map<number, { total: number; activos: number; inactivos: number }>();
      for (const p of productos as any[]) {
        const comercioId = Number(p?.get ? p.get('comercio_id') : p?.comercio_id);
        const activo = Boolean(p?.get ? p.get('activo') : p?.activo);
        const curr = countByComercio.get(comercioId) || { total: 0, activos: 0, inactivos: 0 };
        curr.total += 1;
        if (activo) curr.activos += 1;
        else curr.inactivos += 1;
        countByComercio.set(comercioId, curr);
      }

      const mapped = items.map((i: any) => {
        const c: any = MarketplaceController.mapComercio(i);
        const counter = countByComercio.get(Number(c.comercio_id)) || { total: 0, activos: 0, inactivos: 0 };
        return { ...c, productos_total: counter.total, productos_activos: counter.activos, productos_inactivos: counter.inactivos };
      });

      return res.status(200).json(mapped);
    } catch (error) {
      logger.error('Error listando comercios admin marketplace', error);
      return res.status(500).json({ message: 'Error listando comercios admin' });
    }
  }

  static async listProductos(req: Request, res: Response) {
    try {
      const comercio_id = Number(req.query.comercio_id);
      const includeInactivos = String((req.query as any)?.include_inactivos || '').trim() === '1';
      const where: any = includeInactivos ? {} : { activo: true };
      if (Number.isFinite(comercio_id)) where.comercio_id = comercio_id;
      const items = await ProductoStore.findAll({ where, order: [['producto_id', 'DESC']] });

      if (includeInactivos) {
        return res.status(200).json(items.map((item) => MarketplaceController.mapProducto(item)));
      }

      const comerciosIds = Array.from(new Set((items as any[]).map((p: any) => Number(p.get ? p.get('comercio_id') : p?.comercio_id)).filter(Number.isFinite)));
      const comerciosActivos = await ComercioStore.findAll({ where: { comercio_id: comerciosIds, activo: true } as any, attributes: ['comercio_id'] as any });
      const activosSet = new Set(comerciosActivos.map((c: any) => Number(c.get ? c.get('comercio_id') : c?.comercio_id)));

      const filtrados = (items as any[]).filter((p: any) => activosSet.has(Number(p.get ? p.get('comercio_id') : p?.comercio_id)));
      return res.status(200).json(filtrados.map((item) => MarketplaceController.mapProducto(item)));
    } catch (error) {
      logger.error('Error listando productos marketplace', error);
      return res.status(500).json({ message: 'Error listando productos' });
    }
  }

  static async getProducto(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'ID inválido' });
      const item: any = await ProductoStore.findByPk(id);
      if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
      if (!Boolean(item.get ? item.get('activo') : item?.activo)) return res.status(404).json({ message: 'Producto no encontrado' });

      const comercioId = Number(item.get ? item.get('comercio_id') : item?.comercio_id);
      const comercio: any = await ComercioStore.findByPk(comercioId);
      if (!comercio || !Boolean(comercio.get ? comercio.get('activo') : comercio?.activo)) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      return res.status(200).json(MarketplaceController.mapProducto(item));
    } catch (error) {
      logger.error('Error obteniendo producto marketplace', error);
      return res.status(500).json({ message: 'Error obteniendo producto' });
    }
  }

  static async createProducto(req: Request, res: Response) {
    try {
      const body: any = req.body || {};
      const comercio_id = Number(body.comercio_id);
      const nombre = String(body.nombre || '').trim();
      if (!Number.isFinite(comercio_id) || !nombre) return res.status(400).json({ message: 'comercio_id y nombre son requeridos' });

      const comercio = await ComercioStore.findByPk(comercio_id);
      if (!comercio) return res.status(404).json({ message: 'Comercio no encontrado' });

      const created = await ProductoStore.create({
        comercio_id,
        nombre,
        descripcion: body.descripcion ? String(body.descripcion).slice(0, 1000) : null,
        precio: Number(body.precio || 0),
        stock: Number(body.stock || 0),
        imagen_url: body.imagen_url || null,
        activo: body.activo !== false,
      } as any);

      return res.status(201).json(MarketplaceController.mapProducto(created));
    } catch (error) {
      logger.error('Error creando producto marketplace', error);
      return res.status(500).json({ message: 'Error creando producto' });
    }
  }

  static async updateProducto(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'ID inválido' });
      const item = await ProductoStore.findByPk(id);
      if (!item) return res.status(404).json({ message: 'Producto no encontrado' });

      const body: any = req.body || {};
      if (body.nombre !== undefined) item.set('nombre', String(body.nombre || '').trim());
      if (body.descripcion !== undefined) item.set('descripcion', body.descripcion ? String(body.descripcion).slice(0, 1000) : null);
      if (body.precio !== undefined) item.set('precio', Number(body.precio || 0));
      if (body.stock !== undefined) item.set('stock', Number(body.stock || 0));
      if (body.imagen_url !== undefined) item.set('imagen_url', body.imagen_url || null);
      if (body.activo !== undefined) item.set('activo', Boolean(body.activo));

      await item.save();
      return res.status(200).json(MarketplaceController.mapProducto(item));
    } catch (error) {
      logger.error('Error actualizando producto marketplace', error);
      return res.status(500).json({ message: 'Error actualizando producto' });
    }
  }

  static async deleteProducto(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'ID inválido' });
      const item: any = await ProductoStore.findByPk(id);
      if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
      await item.destroy();
      return res.status(200).json({ ok: true, producto_id: id, deleted: true });
    } catch (error) {
      logger.error('Error eliminando producto marketplace', error);
      return res.status(500).json({ message: 'Error eliminando producto' });
    }
  }

  static async registerEmprendedor(req: Request, res: Response) {
    try {
      const body: any = req.body || {};
      const nombreMarca = String(body.nombre_marca || body.nombreMarca || '').trim();
      const rubro = String(body.rubro || '').trim();
      const telefono = String(body.telefono || '').trim();
      const whatsapp = String(body.whatsapp || '').trim();
      const bio = String(body.bio || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '').trim();

      if (!nombreMarca || !rubro || !telefono || !email || password.length < 6) {
        return res.status(400).json({ message: 'nombre_marca, rubro, telefono, email y password (>=6) son requeridos' });
      }

      const actuales = await ComercioStore.findAll({ where: { socio_id: 0 } as any });
      const emailTomado = (actuales as any[]).some((c) => {
        const meta = MarketplaceController.parseEmprendedorMeta(c?.get ? c.get('descripcion') : c?.descripcion);
        return String(meta?.cuenta?.email || '').toLowerCase() === email;
      });
      if (emailTomado) {
        return res.status(409).json({ message: 'Ya existe una cuenta emprendedora con ese email' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      let slug = slugify(nombreMarca);
      if (!slug) slug = `emprendedor-${Date.now()}`;
      const exists = await ComercioStore.findOne({ where: { slug } as any });
      if (exists) slug = `${slug}-${Date.now().toString().slice(-5)}`;

      const created = await ComercioStore.create({
        socio_id: 0,
        nombre: nombreMarca,
        slug,
        descripcion: MarketplaceController.encodeEmprendedorMeta({
          nombreMarca,
          rubro,
          telefono,
          whatsapp,
          bio,
          estado: 'informal',
          cuenta: { email, passwordHash },
          acompanamiento: { solicitado: false, arca: false, updatedAt: new Date().toISOString() },
        }),
        // Alta emprendedora: queda pendiente de aprobación admin.
        activo: false,
      } as any);

      const mapped: any = MarketplaceController.mapComercio(created);
      if (mapped?.emprendedor?.cuenta) {
        mapped.emprendedor.cuenta = { email: mapped.emprendedor.cuenta.email };
      }
      return res.status(201).json({
        comercio: mapped,
        token: null,
        pendiente_aprobacion: true,
        message: 'Registro recibido. Tu cuenta queda pendiente de aprobación del administrador.',
      });
    } catch (error) {
      logger.error('Error registrando emprendedor', error);
      return res.status(500).json({ message: 'Error registrando emprendedor' });
    }
  }

  static async loginEmprendedor(req: Request, res: Response) {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '').trim();
      if (!email || !password) return res.status(400).json({ message: 'email y password son requeridos' });

      const items = await ComercioStore.findAll({ where: { socio_id: 0 } as any });
      for (const c of items as any[]) {
        const mapped: any = MarketplaceController.mapComercio(c);
        const hash = mapped?.emprendedor?.cuenta?.passwordHash;
        const mail = String(mapped?.emprendedor?.cuenta?.email || '').toLowerCase();
        if (mail === email && hash && (await bcrypt.compare(password, hash))) {
          const token = MarketplaceController.signEmprendedorToken({ comercio_id: mapped.comercio_id, email });
          if (mapped?.emprendedor?.cuenta) {
            mapped.emprendedor.cuenta = { email: mapped.emprendedor.cuenta.email };
          }
          return res.status(200).json({ comercio: mapped, token });
        }
      }

      return res.status(401).json({ message: 'Credenciales inválidas' });
    } catch (error) {
      logger.error('Error login emprendedor', error);
      return res.status(500).json({ message: 'Error login emprendedor' });
    }
  }

  static async getMiEmprendimiento(req: Request, res: Response) {
    try {
      const auth = String(req.headers.authorization || '');
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      const payload = token ? MarketplaceController.verifyEmprendedorToken(token) : null;
      if (!payload?.comercio_id) return res.status(401).json({ message: 'Token inválido' });

      const comercio = await ComercioStore.findByPk(Number(payload.comercio_id));
      if (!comercio) return res.status(404).json({ message: 'Emprendimiento no encontrado' });

      const mapped: any = MarketplaceController.mapComercio(comercio);
      if (mapped?.emprendedor?.cuenta) mapped.emprendedor.cuenta = { email: mapped.emprendedor.cuenta.email };
      const productos = await ProductoStore.findAll({ where: { comercio_id: Number(payload.comercio_id) } as any, order: [['producto_id', 'DESC']] });
      return res.status(200).json({ comercio: mapped, productos: productos.map((p) => MarketplaceController.mapProducto(p)) });
    } catch (error) {
      logger.error('Error obteniendo mi emprendimiento', error);
      return res.status(500).json({ message: 'Error obteniendo mi emprendimiento' });
    }
  }

  static async actualizarMiEmprendimiento(req: Request, res: Response) {
    try {
      const auth = String(req.headers.authorization || '');
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      const payload = token ? MarketplaceController.verifyEmprendedorToken(token) : null;
      if (!payload?.comercio_id) return res.status(401).json({ message: 'Token inválido' });

      const comercio: any = await ComercioStore.findByPk(Number(payload.comercio_id));
      if (!comercio) return res.status(404).json({ message: 'Emprendimiento no encontrado' });
      const meta = MarketplaceController.parseEmprendedorMeta(comercio.get('descripcion')) || {};

      const body: any = req.body || {};
      const merged = {
        ...meta,
        nombreMarca: body.nombre_marca ?? body.nombreMarca ?? meta.nombreMarca,
        rubro: body.rubro ?? meta.rubro,
        telefono: body.telefono ?? meta.telefono,
        whatsapp: body.whatsapp ?? meta.whatsapp,
        bio: body.bio ?? meta.bio,
        estado: body.estado ?? meta.estado ?? 'informal',
        cuenta: meta.cuenta,
        acompanamiento: {
          ...(meta.acompanamiento || {}),
          ...(body.acompanamiento || {}),
          updatedAt: new Date().toISOString(),
        },
      };

      comercio.set('nombre', String(merged.nombreMarca || comercio.get('nombre') || '').trim());
      comercio.set('descripcion', MarketplaceController.encodeEmprendedorMeta(merged as any));
      await comercio.save();

      const mapped: any = MarketplaceController.mapComercio(comercio);
      if (mapped?.emprendedor?.cuenta) mapped.emprendedor.cuenta = { email: mapped.emprendedor.cuenta.email };
      return res.status(200).json(mapped);
    } catch (error) {
      logger.error('Error actualizando emprendimiento', error);
      return res.status(500).json({ message: 'Error actualizando emprendimiento' });
    }
  }

  static async listEmprendedores(_req: Request, res: Response) {
    try {
      const items = await ComercioStore.findAll({ where: { socio_id: 0, activo: true } as any, order: [['comercio_id', 'DESC']] });
      return res.status(200).json(items.map((i) => {
        const mapped: any = MarketplaceController.mapComercio(i);
        if (mapped?.emprendedor?.cuenta) mapped.emprendedor.cuenta = { email: mapped.emprendedor.cuenta.email };
        return mapped;
      }));
    } catch (error) {
      logger.error('Error listando emprendedores', error);
      return res.status(500).json({ message: 'Error listando emprendedores' });
    }
  }

  static async listEmprendedoresAdmin(req: Request, res: Response) {
    try {
      const includeInactivos = String((req.query as any)?.include_inactivos || '').trim() === '1';
      const where: any = includeInactivos ? { socio_id: 0 } : { socio_id: 0, activo: true };
      const items = await ComercioStore.findAll({ where, order: [['comercio_id', 'DESC']] });
      return res.status(200).json(items.map((i: any) => {
        const mapped: any = MarketplaceController.mapComercio(i);
        if (mapped?.emprendedor?.cuenta) mapped.emprendedor.cuenta = { email: mapped.emprendedor.cuenta.email };
        return mapped;
      }));
    } catch (error) {
      logger.error('Error listando emprendedores admin', error);
      return res.status(500).json({ message: 'Error listando emprendedores admin' });
    }
  }

  static async resetPasswordEmprendedorAdmin(req: Request, res: Response) {
    try {
      const comercioId = Number(req.params.comercioId);
      const newPassword = String(req.body?.password || '').trim();
      if (!Number.isFinite(comercioId) || newPassword.length < 6) {
        return res.status(400).json({ message: 'comercioId válido y password (>=6) requeridos' });
      }

      const comercio: any = await ComercioStore.findByPk(comercioId);
      if (!comercio) return res.status(404).json({ message: 'Emprendedor no encontrado' });
      if (Number(comercio.get('socio_id')) !== 0) return res.status(400).json({ message: 'El comercio no es emprendedor' });

      const meta = MarketplaceController.parseEmprendedorMeta(comercio.get('descripcion'));
      if (!meta?.cuenta?.email) return res.status(400).json({ message: 'No se encontró cuenta emprendedora' });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const merged = {
        ...meta,
        cuenta: { ...meta.cuenta, passwordHash },
      };
      comercio.set('descripcion', MarketplaceController.encodeEmprendedorMeta(merged as any));
      await comercio.save();

      return res.status(200).json({ ok: true, comercio_id: comercioId, email: meta.cuenta.email });
    } catch (error) {
      logger.error('Error reseteando password emprendedor (admin)', error);
      return res.status(500).json({ message: 'Error reseteando password emprendedor' });
    }
  }

  static async deleteEmprendedorAdmin(req: Request, res: Response) {
    try {
      const comercioId = Number(req.params.comercioId);
      if (!Number.isFinite(comercioId)) return res.status(400).json({ message: 'comercioId inválido' });

      const comercio: any = await ComercioStore.findByPk(comercioId);
      if (!comercio) return res.status(404).json({ message: 'Emprendedor no encontrado' });
      if (Number(comercio.get('socio_id')) !== 0) return res.status(400).json({ message: 'El comercio no es emprendedor' });

      const productosEliminados = await ProductoStore.destroy({ where: { comercio_id: comercioId } as any });
      await comercio.destroy();

      return res.status(200).json({ ok: true, comercio_id: comercioId, deleted: true, productos_eliminados: productosEliminados });
    } catch (error) {
      logger.error('Error eliminando emprendedor (admin)', error);
      return res.status(500).json({ message: 'Error eliminando emprendedor' });
    }
  }

  static async sugerirProductoIa(req: Request, res: Response) {
    try {
      const body: any = req.body || {};
      const rubro = String(body.rubro || '').trim() || 'general';
      const nombreMarca = String(body.nombre_marca || body.nombreMarca || 'Emprendedor').trim();
      const fotoNombre = String(body.foto_nombre || body.fotoNombre || 'producto').trim();
      const baseName = fotoNombre.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();

      const priceByRubro: Record<string, number> = {
        indumentaria: 18000,
        gastronomia: 9500,
        tecnologia: 65000,
        hogar: 23000,
        belleza: 14000,
        artesania: 12000,
        servicios: 25000,
      };

      const key = slugify(rubro).replace(/-/g, '');
      const precioBase = priceByRubro[key] || 15000;
      const precioSugerido = Number((precioBase * (0.9 + Math.random() * 0.3)).toFixed(0));

      const title = baseName
        ? `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} · ${nombreMarca}`
        : `Producto de ${nombreMarca}`;

      const descripcion = `Producto publicado por ${nombreMarca} (${rubro}). Ideal para venta local en Bolívar. Consultá disponibilidad y coordina compra directa por WhatsApp.`;

      return res.status(200).json({
        titulo: title.slice(0, 220),
        descripcion: descripcion.slice(0, 1000),
        precio_sugerido: precioSugerido,
        categoria: rubro,
        confianza: 0.78,
      });
    } catch (error) {
      logger.error('Error sugiriendo producto con IA', error);
      return res.status(500).json({ message: 'Error sugiriendo producto con IA' });
    }
  }

  static async publicarProductoEmprendedor(req: Request, res: Response) {
    try {
      const body: any = req.body || {};
      const comercio_id = Number(body.comercio_id);
      const nombre = String(body.nombre || '').trim();
      const descripcion = String(body.descripcion || '').trim();
      const precio = Number(body.precio || 0);
      const stock = Number(body.stock || 1);
      const imagen_url = body.imagen_url || null;

      if (!Number.isFinite(comercio_id) || !nombre) {
        return res.status(400).json({ message: 'comercio_id y nombre son requeridos' });
      }

      const comercio: any = await ComercioStore.findByPk(comercio_id);
      if (!comercio) return res.status(404).json({ message: 'Comercio no encontrado' });

      const created = await ProductoStore.create({
        comercio_id,
        nombre,
        descripcion: descripcion || null,
        precio: Number.isFinite(precio) ? precio : 0,
        stock: Number.isFinite(stock) ? stock : 1,
        imagen_url,
        activo: true,
      } as any);

      return res.status(201).json(MarketplaceController.mapProducto(created));
    } catch (error) {
      logger.error('Error publicando producto de emprendedor', error);
      return res.status(500).json({ message: 'Error publicando producto de emprendedor' });
    }
  }

  static async seedDemo(_req: Request, res: Response) {
    try {
      const count = await ComercioStore.count();
      if (count > 0) return res.status(200).json({ ok: true, message: 'Ya existe data marketplace' });

      const comercios = await ComercioStore.bulkCreate([
        { socio_id: 1, nombre: 'GastroBol', slug: 'gastrobol', activo: true },
        { socio_id: 1, nombre: 'Electro Sur', slug: 'electro-sur', activo: true },
      ] as any[]);

      await ProductoStore.bulkCreate([
        { comercio_id: Number(comercios[0].get('comercio_id')), nombre: 'Mixer industrial 5L', precio: 489999, stock: 12, activo: true, descripcion: 'Mixer robusto para gastronomía' },
        { comercio_id: Number(comercios[1].get('comercio_id')), nombre: 'Pack luces LED local', precio: 119900, stock: 24, activo: true, descripcion: 'Pack de iluminación LED para comercio' },
      ] as any[]);

      return res.status(201).json({ ok: true });
    } catch (error) {
      logger.error('Error seed marketplace', error);
      return res.status(500).json({ message: 'Error seed marketplace' });
    }
  }
}

export default MarketplaceController;
