import { Request, Response } from 'express';
import logger from '../configs/logger';
import azureBlobService from '../service/azureBlob.service';
import SocioService from '../service/socio.service';
import { ISocioService } from '../interfaces/Isocio.service';
import ComercioPuntos from '../models/ComercioPuntos.models';
import ProductoStore from '../models/ProductoStore.models';

class FilesController {
  private static socioService: ISocioService = new SocioService();

  static async subirArchivo(req: Request, res: Response) {
    try {
      const { carpeta, entidadId, subcarpeta } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Debe enviar un archivo en el campo "file"' });
      }

      if (!carpeta || !entidadId) {
        return res.status(400).json({
          message: 'Los campos "carpeta" y "entidadId" son obligatorios',
        });
      }

      const url = await azureBlobService.subirArchivo({
        buffer: file.buffer,
        nombreArchivo: file.originalname,
        carpeta,
        entidadId,
        subcarpeta,
        contentType: file.mimetype,
      });

      return res.status(201).json({
        message: 'Archivo subido correctamente',
        url,
      });
    } catch (error) {
      logger.error('Error al subir archivo a Azure Blob:', error);
      return res.status(500).json({
        message: 'Error al subir archivo',
      });
    }
  }

  static async subirLogoSocio(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Debe enviar un archivo en el campo "file"' });
      }

      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'El logo debe ser una imagen' });
      }

      const socio = await FilesController.socioService.getSocioById(Number(socioId));
      if (!socio) {
        return res.status(404).json({ message: 'Socio no encontrado' });
      }

      const nombreArchivo = `logo-${Date.now()}-${file.originalname}`;
      const logoUrl = await azureBlobService.subirArchivo({
        buffer: file.buffer,
        nombreArchivo,
        carpeta: 'socios',
        entidadId: socioId,
        subcarpeta: 'logo',
        contentType: file.mimetype,
      });

      const blobPath = azureBlobService.getBlobPathFromUrl(logoUrl) || logoUrl;
      const logoReadUrl = azureBlobService.getReadOnlyUrl(blobPath);

      await FilesController.socioService.updateSocio(Number(socioId), {
        // Guardamos blobPath (más corto) para evitar overflow de columna.
        socio_firma: blobPath,
      });

      return res.status(201).json({
        message: 'Logo de socio subido correctamente',
        socioId: Number(socioId),
        logoUrl: logoReadUrl,
        socio_firma: logoReadUrl,
      });
    } catch (error: any) {
      logger.error(`Error al subir logo de socio: ${error?.message || error}`);
      return res.status(500).json({
        message: 'Error al subir logo del socio',
      });
    }
  }

  static async subirLogoComercio(req: Request, res: Response) {
    try {
      const { comercioId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Debe enviar un archivo en el campo "file"' });
      }

      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'El logo debe ser una imagen' });
      }

      const comercio = await ComercioPuntos.findByPk(Number(comercioId));
      if (!comercio) {
        return res.status(404).json({ message: 'Comercio no encontrado' });
      }

      const nombreArchivo = `logo-comercio-${Date.now()}-${file.originalname}`;
      const logoUrl = await azureBlobService.subirArchivo({
        buffer: file.buffer,
        nombreArchivo,
        carpeta: 'comercios',
        entidadId: comercioId,
        subcarpeta: 'logo',
        contentType: file.mimetype,
      });

      const blobPath = azureBlobService.getBlobPathFromUrl(logoUrl) || logoUrl;
      const logoReadUrl = azureBlobService.getReadOnlyUrl(blobPath);

      try {
        comercio.set('logo_url', blobPath);
        await comercio.save();

        return res.status(201).json({
          message: 'Logo de comercio subido correctamente',
          comercioId: Number(comercioId),
          logo_url: logoReadUrl,
        });
      } catch (saveError: any) {
        const msg = String(saveError?.message || '');
        if (msg.toLowerCase().includes('logo_url') || msg.toLowerCase().includes('invalid column')) {
          // Compat temporal: el archivo se subió, pero la DB aún no tiene la columna.
          return res.status(202).json({
            message: 'Logo subido, pero falta columna logo_url en DB para persistirlo',
            comercioId: Number(comercioId),
            logo_url: logoReadUrl,
            warning: 'DB_MISSING_LOGO_URL_COLUMN',
          });
        }
        throw saveError;
      }
    } catch (error: any) {
      logger.error(`Error al subir logo de comercio: ${error?.message || error}`);
      return res.status(500).json({ message: 'Error al subir logo del comercio' });
    }
  }

  static async subirImagenProducto(req: Request, res: Response) {
    try {
      const { productoId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'Debe enviar un archivo en el campo "file"' });
      }

      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'La imagen del producto debe ser una imagen' });
      }

      const producto = await ProductoStore.findByPk(Number(productoId));
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      const comercioId = Number(producto.get('comercio_id'));
      const nombreArchivo = `producto-${Date.now()}-${file.originalname}`;
      const imageUrl = await azureBlobService.subirArchivo({
        buffer: file.buffer,
        nombreArchivo,
        carpeta: 'comercios',
        entidadId: comercioId,
        subcarpeta: `productos/${productoId}`,
        contentType: file.mimetype,
      });

      const blobPath = azureBlobService.getBlobPathFromUrl(imageUrl) || imageUrl;
      const imageReadUrl = azureBlobService.getReadOnlyUrl(blobPath);

      producto.set('imagen_url', blobPath);
      await producto.save();

      return res.status(201).json({
        message: 'Imagen de producto subida correctamente',
        productoId: Number(productoId),
        imagen_url: imageReadUrl,
      });
    } catch (error: any) {
      logger.error(`Error al subir imagen de producto: ${error?.message || error}`);
      return res.status(500).json({ message: 'Error al subir imagen del producto' });
    }
  }
}

export default FilesController;
