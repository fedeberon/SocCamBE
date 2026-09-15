import { Request, Response } from 'express';
import { QueryTypes, Transaction } from 'sequelize';
import logger from '../configs/logger';
import sequelize from '../configs/database';
import Categoria from '../models/Categoria.models';
import SocioCategoria from '../models/SocioCategoria.models';
import SocioServicio from '../models/SocioServicio.models';
import Servicio from '../models/Servicio.models';
import Socio from '../models/socio.models';

class CategoriaController {
  private static parseId(value: string | undefined): number {
    const id = Number(value);
    return Number.isNaN(id) ? NaN : id;
  }

  private static async getCategoriaActiva(categoriaId: number) {
    return Categoria.findOne({
      where: { categoria_id: categoriaId, deleted: false },
    });
  }

  static async listar(req: Request, res: Response) {
    try {
      const categorias = await Categoria.findAll({
        where: { deleted: false },
        order: [['nombre', 'ASC']],
        raw: true,
      });

      if (!categorias.length) {
        return res.status(200).json([]);
      }

      const ids = (categorias as any[]).map((c: any) => c.categoria_id);

      const [sociosRows, serviciosRows] = await Promise.all([
        sequelize.query(
          `SELECT sc.categoria_id, COUNT(DISTINCT sc.socio_id) AS socios
           FROM dbo.socio_categoria sc
           WHERE sc.categoria_id IN (:ids)
           GROUP BY sc.categoria_id`,
          { replacements: { ids }, type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT sc.categoria_id, COUNT(DISTINCT ss.servicio_id) AS servicios
           FROM dbo.socio_categoria sc
           INNER JOIN dbo.socio_servicio ss ON ss.socio_id = sc.socio_id
           WHERE sc.categoria_id IN (:ids)
           GROUP BY sc.categoria_id`,
          { replacements: { ids }, type: QueryTypes.SELECT }
        ),
      ]);

      const sociosPorCategoria = new Map<any, number>();
      for (const r of sociosRows as any[])
        sociosPorCategoria.set(r.categoria_id, Number(r.socios) || 0);
      const serviciosPorCategoria = new Map<any, number>();
      for (const r of serviciosRows as any[])
        serviciosPorCategoria.set(r.categoria_id, Number(r.servicios) || 0);

      const response = (categorias as any[]).map((c: any) => ({
        categoria_id: c.categoria_id,
        nombre: c.nombre,
        descripcion: c.descripcion,
        deleted: c.deleted,
        creado_en: c.creado_en,
        socios: sociosPorCategoria.get(c.categoria_id) || 0,
        servicios: serviciosPorCategoria.get(c.categoria_id) || 0,
      }));

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al obtener categorías', error);
      res.status(500).json({ message: 'Error al obtener categorías', error });
    }
  }

  static async obtener(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    if (Number.isNaN(categoriaId) || categoriaId <= 0) {
      return res
        .status(400)
        .json({ message: 'id debe ser numérico y mayor a 0' });
    }

    try {
      const categoria =
        await CategoriaController.getCategoriaActiva(categoriaId);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.status(200).json(categoria);
    } catch (error) {
      logger.error('Error al obtener categoría', error);
      res.status(500).json({ message: 'Error al obtener categoría', error });
    }
  }

  static async crear(req: Request, res: Response) {
    try {
      const { nombre, descripcion } = req.body || {};

      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ message: 'nombre es requerido' });
      }

      const nombreLimpio = nombre.trim();
      const existente = await Categoria.findOne({
        where: { nombre: nombreLimpio },
      });
      if (existente) {
        if (existente.getDataValue('deleted') === true) {
          await existente.update({
            deleted: false,
            descripcion: descripcion ?? existente.getDataValue('descripcion'),
          });
          return res.status(200).json(existente);
        }
        return res
          .status(409)
          .json({ message: 'Ya existe una categoría con ese nombre' });
      }

      const categoria = await Categoria.create({
        nombre: nombreLimpio,
        descripcion: descripcion ? String(descripcion).trim() : null,
      });

      res.status(201).json(categoria);
    } catch (error) {
      logger.error('Error al crear categoría', error);
      res.status(500).json({ message: 'Error al crear categoría', error });
    }
  }

  static async actualizar(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    if (Number.isNaN(categoriaId) || categoriaId <= 0) {
      return res
        .status(400)
        .json({ message: 'id debe ser numérico y mayor a 0' });
    }

    const { nombre, descripcion } = req.body || {};

    if (
      nombre !== undefined &&
      (typeof nombre !== 'string' || !nombre.trim())
    ) {
      return res
        .status(400)
        .json({ message: 'nombre debe ser un string no vacío' });
    }

    try {
      const categoria =
        await CategoriaController.getCategoriaActiva(categoriaId);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      const payload: { nombre?: string; descripcion?: string | null } = {};
      if (nombre !== undefined) payload.nombre = nombre.trim();
      if (descripcion !== undefined)
        payload.descripcion = descripcion ? String(descripcion).trim() : null;

      if (!Object.keys(payload).length) {
        return res
          .status(400)
          .json({ message: 'No se enviaron campos para actualizar' });
      }

      if (payload.nombre) {
        const duplicada = await Categoria.findOne({
          where: { nombre: payload.nombre, deleted: false },
        });
        if (
          duplicada &&
          duplicada.getDataValue('categoria_id') !== categoriaId
        ) {
          return res
            .status(409)
            .json({ message: 'Ya existe una categoría con ese nombre' });
        }
      }

      await categoria.update(payload);
      res.status(200).json(categoria);
    } catch (error) {
      logger.error('Error al actualizar categoría', error);
      res.status(500).json({ message: 'Error al actualizar categoría', error });
    }
  }

  static async eliminar(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    if (Number.isNaN(categoriaId) || categoriaId <= 0) {
      return res
        .status(400)
        .json({ message: 'id debe ser numérico y mayor a 0' });
    }

    try {
      const categoria =
        await CategoriaController.getCategoriaActiva(categoriaId);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      if (categoria.getDataValue('deleted') === true) {
        return res
          .status(200)
          .json({ message: 'Categoría ya estaba dada de baja', categoriaId });
      }

      await categoria.update({ deleted: true });
      res.status(200).json({ message: 'Categoría dada de baja', categoriaId });
    } catch (error) {
      logger.error('Error al dar de baja categoría', error);
      res
        .status(500)
        .json({ message: 'Error al dar de baja categoría', error });
    }
  }

  static async listarPorSocio(req: Request, res: Response) {
    const socioId = CategoriaController.parseId(req.params.socioId);
    if (Number.isNaN(socioId) || socioId <= 0) {
      return res
        .status(400)
        .json({ message: 'socioId debe ser numérico y mayor a 0' });
    }

    try {
      const rows = await SocioCategoria.findAll({
        where: { socio_id: socioId },
        include: [{ model: Categoria, as: 'categoria' }],
      });

      const categorias = (rows as any[])
        .map((r: any) => r.categoria)
        .filter((c: any) => c && c.deleted !== true);

      res.status(200).json(categorias);
    } catch (error) {
      logger.error('Error al obtener categorías del socio', error);
      res
        .status(500)
        .json({ message: 'Error al obtener categorías del socio', error });
    }
  }

  static async listarSocios(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    if (Number.isNaN(categoriaId) || categoriaId <= 0) {
      return res
        .status(400)
        .json({ message: 'id debe ser numérico y mayor a 0' });
    }

    try {
      const categoria =
        await CategoriaController.getCategoriaActiva(categoriaId);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      const rows = await SocioCategoria.findAll({
        where: { categoria_id: categoriaId },
        include: [
          {
            model: Socio,
            as: 'socio',
            attributes: [
              'socio_id',
              'socio_nombre',
              'socio_apellido',
              'socio_dni',
              'socio_mail',
            ],
          },
        ],
        order: [['creado_en', 'DESC']],
      });

      const response = (rows as any[])
        .filter((r: any) => r && r.socio)
        .map((r: any) => ({
          ...(r.socio.toJSON?.() ?? r.socio),
          socio_categoria_id: r.socio_categoria_id,
          asignado_en: r.creado_en,
        }));

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al obtener socios de la categoría', error);
      res
        .status(500)
        .json({ message: 'Error al obtener socios de la categoría', error });
    }
  }

  static async asignarSocio(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    const socioId = CategoriaController.parseId(req.body?.socioId);

    if (
      Number.isNaN(categoriaId) ||
      categoriaId <= 0 ||
      Number.isNaN(socioId) ||
      socioId <= 0
    ) {
      return res
        .status(400)
        .json({ message: 'id y socioId deben ser numéricos y mayores a 0' });
    }

    try {
      const categoria =
        await CategoriaController.getCategoriaActiva(categoriaId);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      const existente = await SocioCategoria.findOne({
        where: { socio_id: socioId, categoria_id: categoriaId },
      });
      if (existente) {
        return res
          .status(409)
          .json({ message: 'El socio ya pertenece a esta categoría' });
      }

      const asignacion = await SocioCategoria.create({
        socio_id: socioId,
        categoria_id: categoriaId,
      });
      res.status(201).json(asignacion);
    } catch (error) {
      logger.error('Error al asignar socio a categoría', error);
      res
        .status(500)
        .json({ message: 'Error al asignar socio a categoría', error });
    }
  }

  static async quitarSocio(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    const socioId = CategoriaController.parseId(req.params.socioId);

    if (
      Number.isNaN(categoriaId) ||
      categoriaId <= 0 ||
      Number.isNaN(socioId) ||
      socioId <= 0
    ) {
      return res
        .status(400)
        .json({ message: 'id y socioId deben ser numéricos y mayores a 0' });
    }

    try {
      const asignacion = await SocioCategoria.findOne({
        where: { socio_id: socioId, categoria_id: categoriaId },
      });
      if (!asignacion) {
        return res
          .status(404)
          .json({ message: 'El socio no pertenece a esta categoría' });
      }

      await asignacion.destroy();
      res
        .status(200)
        .json({
          message: 'Socio removido de la categoría',
          categoriaId,
          socioId,
        });
    } catch (error) {
      logger.error('Error al quitar socio de categoría', error);
      res
        .status(500)
        .json({ message: 'Error al quitar socio de categoría', error });
    }
  }

  static async listarServicios(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    if (Number.isNaN(categoriaId) || categoriaId <= 0) {
      return res
        .status(400)
        .json({ message: 'id debe ser numérico y mayor a 0' });
    }

    try {
      const categoria =
        await CategoriaController.getCategoriaActiva(categoriaId);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      const [sociosRows, servicios, asignadosRows] = await Promise.all([
        sequelize.query(
          `SELECT socio_id FROM dbo.socio_categoria WHERE categoria_id = :categoriaId`,
          { replacements: { categoriaId }, type: QueryTypes.SELECT }
        ),
        Servicio.findAll({
          where: { activo: true },
          order: [['nombre', 'ASC']],
        }),
        sequelize.query(
          `SELECT ss.servicio_id, COUNT(DISTINCT ss.socio_id) AS asignados
           FROM dbo.socio_servicio ss
           INNER JOIN dbo.socio_categoria sc ON sc.socio_id = ss.socio_id
           WHERE sc.categoria_id = :categoriaId
           GROUP BY ss.servicio_id`,
          { replacements: { categoriaId }, type: QueryTypes.SELECT }
        ),
      ]);

      const sociosTotales = Array.isArray(sociosRows) ? sociosRows.length : 0;
      const asignadosPorServicio = new Map<any, number>();
      for (const r of asignadosRows as any[])
        asignadosPorServicio.set(r.servicio_id, Number(r.asignados) || 0);

      const response = (servicios as any[]).map((s: any) => ({
        servicio_id: s.servicio_id,
        nombre: s.nombre,
        descripcion: s.descripcion,
        categoria: s.categoria,
        icono: s.icono,
        asignados: asignadosPorServicio.get(s.servicio_id) || 0,
      }));

      res
        .status(200)
        .json({
          categoria_id: categoriaId,
          nombre_categoria: categoria.getDataValue('nombre'),
          total_socios: sociosTotales,
          servicios: response,
        });
    } catch (error) {
      logger.error('Error al obtener servicios de la categoría', error);
      res
        .status(500)
        .json({ message: 'Error al obtener servicios de la categoría', error });
    }
  }

  static async asignarServicios(req: Request, res: Response) {
    const categoriaId = CategoriaController.parseId(req.params.id);
    const { servicios, sociosIds } = req.body || {};

    if (Number.isNaN(categoriaId) || categoriaId <= 0) {
      return res
        .status(400)
        .json({ message: 'id debe ser numérico y mayor a 0' });
    }

    if (!Array.isArray(servicios) || !servicios.length) {
      return res
        .status(400)
        .json({ message: 'servicios debe ser un array no vacío de ids' });
    }

    let sociosIdsValidos: number[] | null = null;
    if (sociosIds !== undefined) {
      if (!Array.isArray(sociosIds)) {
        return res
          .status(400)
          .json({ message: 'sociosIds debe ser un array de ids' });
      }
      sociosIdsValidos = sociosIds
        .map(Number)
        .filter((n: number) => !Number.isNaN(n) && n > 0);
    }

    const serviciosIdsValidos = servicios
      .map(Number)
      .filter((n: number) => !Number.isNaN(n) && n > 0);
    if (!serviciosIdsValidos.length) {
      return res
        .status(400)
        .json({ message: 'No se enviaron ids de servicios válidos' });
    }

    let transaction: Transaction | undefined;
    try {
      const categoria =
        await CategoriaController.getCategoriaActiva(categoriaId);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      const sociosDeLaCategoria = (await sequelize.query(
        `SELECT socio_id FROM dbo.socio_categoria WHERE categoria_id = :categoriaId`,
        { replacements: { categoriaId }, type: QueryTypes.SELECT }
      )) as any[];

      const sociosFiltrados = sociosIdsValidos
        ? sociosDeLaCategoria.filter((s: any) =>
            sociosIdsValidos!.includes(Number(s.socio_id))
          )
        : sociosDeLaCategoria;

      if (!sociosFiltrados.length) {
        return res.status(200).json({
          message: 'No hay socios en la categoría para asignar servicios',
          categoriaId,
          asignados: 0,
          yaAsignados: 0,
          totalSocios: 0,
          totalServicios: serviciosIdsValidos.length,
        });
      }

      const serviciosValidos = (await Servicio.findAll({
        where: { servicio_id: serviciosIdsValidos, activo: true },
      })) as any[];

      transaction = await sequelize.transaction();

      let asignados = 0;
      let yaAsignados = 0;

      for (const socio of sociosFiltrados) {
        for (const servicio of serviciosValidos) {
          const [asociacion, created] = await SocioServicio.findOrCreate({
            where: {
              socio_id: Number(socio.socio_id),
              servicio_id: servicio.servicio_id,
            },
            defaults: {},
            transaction,
          });
          if (created) {
            asignados += 1;
          } else {
            yaAsignados += 1;
          }
          void asociacion;
        }
      }

      await transaction.commit();

      res.status(200).json({
        message: 'Servicios asignados',
        categoriaId,
        asignados,
        yaAsignados,
        totalSocios: sociosFiltrados.length,
        totalServicios: serviciosValidos.length,
      });
    } catch (error) {
      if (transaction) await transaction.rollback();
      logger.error('Error al asignar servicios por categoría', error);
      res
        .status(500)
        .json({ message: 'Error al asignar servicios por categoría', error });
    }
  }
}

export default CategoriaController;
