import { Request, Response } from 'express';
import logger from '../configs/logger';
import ComercioStore from '../models/ComercioStore.models';
import ProductoStore from '../models/ProductoStore.models';

const slugify = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 180);

class MarketplaceController {
  static async listComercios(_req: Request, res: Response) {
    try {
      const items = await ComercioStore.findAll({ where: { activo: true } as any, order: [['nombre', 'ASC']] });
      return res.status(200).json(items);
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
      return res.status(200).json(comercio);
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
      return res.status(201).json(created);
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
      return res.status(200).json(item);
    } catch (error) {
      logger.error('Error actualizando comercio marketplace', error);
      return res.status(500).json({ message: 'Error actualizando comercio' });
    }
  }

  static async listProductos(req: Request, res: Response) {
    try {
      const comercio_id = Number(req.query.comercio_id);
      const where: any = { activo: true };
      if (Number.isFinite(comercio_id)) where.comercio_id = comercio_id;
      const items = await ProductoStore.findAll({ where, order: [['producto_id', 'DESC']] });
      return res.status(200).json(items);
    } catch (error) {
      logger.error('Error listando productos marketplace', error);
      return res.status(500).json({ message: 'Error listando productos' });
    }
  }

  static async getProducto(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: 'ID inválido' });
      const item = await ProductoStore.findByPk(id);
      if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
      return res.status(200).json(item);
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

      return res.status(201).json(created);
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
      return res.status(200).json(item);
    } catch (error) {
      logger.error('Error actualizando producto marketplace', error);
      return res.status(500).json({ message: 'Error actualizando producto' });
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
