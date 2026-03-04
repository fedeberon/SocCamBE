import { Request, Response } from 'express';
import logger from '../configs/logger';
import azureBlobService from '../service/azureBlob.service';
import SocioService from '../service/socio.service';
import { ISocioService } from '../interfaces/Isocio.service';

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
}

export default FilesController;
