import {
  BlobServiceClient,
  BlockBlobUploadOptions,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  SASProtocol,
} from '@azure/storage-blob';
import logger from '../configs/logger';

export interface SubirArchivoInput {
  buffer: Buffer;
  nombreArchivo: string;
  carpeta: string;
  entidadId: string | number;
  subcarpeta?: string;
  contentType?: string;
}

class AzureBlobService {
  private readonly containerName: string;
  private readonly connectionString?: string;

  constructor() {
    const rawConnectionString = process.env.AZURE_BLOB_STORAGE_CONNECTION || process.env.AZURE_STORAGE_CONNECTION;
    const connectionString = rawConnectionString
      ? String(rawConnectionString).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').replace(/[\r\n]+/g, '')
      : undefined;
    const containerName = process.env.AZURE_BLOB_STORAGE_CONTAINER || process.env.AZURE_STORAGE_CONTAINER || 'socios-assets';

    this.connectionString = connectionString;
    this.containerName = containerName;
  }

  private getContainerClient() {
    if (!this.connectionString) {
      throw new Error('Falta la variable de entorno AZURE_BLOB_STORAGE_CONNECTION (o AZURE_STORAGE_CONNECTION por compatibilidad)');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
    return blobServiceClient.getContainerClient(this.containerName);
  }

  private getConnectionStringPart(key: string): string | null {
    if (!this.connectionString) {
      return null;
    }

    const parts = this.connectionString.split(';');
    const found = parts.find((part) => part.startsWith(`${key}=`));
    return found ? found.substring(`${key}=`.length) : null;
  }

  private sanitizePathSegment(value: string | number): string {
    return String(value).trim().replace(/[^a-zA-Z0-9._-]/g, '-');
  }

  private buildBlobPath(input: SubirArchivoInput): string {
    const carpeta = this.sanitizePathSegment(input.carpeta);
    const entidadId = this.sanitizePathSegment(input.entidadId);
    const nombreArchivo = this.sanitizePathSegment(input.nombreArchivo);
    const subcarpeta = input.subcarpeta ? `${this.sanitizePathSegment(input.subcarpeta)}/` : '';

    return `${carpeta}/${entidadId}/${subcarpeta}${nombreArchivo}`;
  }

  async subirArchivo(input: SubirArchivoInput): Promise<string> {
    const containerClient = this.getContainerClient();
    await containerClient.createIfNotExists();

    const blobPath = this.buildBlobPath(input);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    const options: BlockBlobUploadOptions = input.contentType
      ? { blobHTTPHeaders: { blobContentType: input.contentType } }
      : {};

    await blockBlobClient.uploadData(input.buffer, options);
    return blockBlobClient.url;
  }

  async subirArchivoSocio(buffer: Buffer, nombreArchivo: string, socioId: number | string): Promise<string> {
    return this.subirArchivo({
      buffer,
      nombreArchivo,
      carpeta: 'socios',
      entidadId: socioId,
      subcarpeta: 'documentacion',
    });
  }

  async eliminarArchivo(blobPath: string): Promise<void> {
    const containerClient = this.getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.deleteIfExists();
  }

  getBlobPathFromUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        return null;
      }

      pathParts.shift();
      return pathParts.join('/');
    } catch (error) {
      logger.error(`No se pudo obtener blobPath de la URL: ${url}`);
      return null;
    }
  }

  getReadOnlyUrl(urlOrBlobPath: string, expiresInMinutes = 60): string {
    if (!this.connectionString) {
      throw new Error('Falta la variable de entorno AZURE_BLOB_STORAGE_CONNECTION (o AZURE_STORAGE_CONNECTION por compatibilidad)');
    }

    const accountName = this.getConnectionStringPart('AccountName');
    const accountKey = this.getConnectionStringPart('AccountKey');
    const protocol = this.getConnectionStringPart('DefaultEndpointsProtocol') || 'https';
    const endpointSuffix = this.getConnectionStringPart('EndpointSuffix') || 'core.windows.net';

    if (!accountName || !accountKey) {
      throw new Error('No se pudo leer AccountName/AccountKey desde AZURE_BLOB_STORAGE_CONNECTION (o AZURE_STORAGE_CONNECTION)');
    }

    // Siempre firmar contra la configuración actual del backend
    // (evita romper cuando en DB queda una URL vieja con otro container/account).
    let containerName = this.containerName;
    let blobName = String(urlOrBlobPath || '').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

    try {
      const parsedUrl = new URL(blobName);
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      if (parts.length < 2) {
        throw new Error('URL de blob inválida');
      }

      // Si viene URL completa: /<container>/<blobPath>
      // ignoramos el container persistido y usamos el actual.
      blobName = parts.slice(1).join('/');
    } catch (error) {
      blobName = blobName.replace(/^\/+/, '');
      // Si vino como '<container>/<blobPath>', quitar el container viejo.
      if (blobName.startsWith(`${containerName}/`)) {
        blobName = blobName.substring(containerName.length + 1);
      }
    }

    // limpiar query/hash residuales si quedaron en la ruta
    blobName = blobName.split('?')[0].split('#')[0];

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const startsOn = new Date(Date.now() - 2 * 60 * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: protocol === 'http' ? SASProtocol.HttpsAndHttp : SASProtocol.Https,
      },
      sharedKeyCredential
    ).toString();

    return `${protocol}://${accountName}.blob.${endpointSuffix}/${containerName}/${blobName}?${sasToken}`;
  }
}

const azureBlobService = new AzureBlobService();

export default azureBlobService;
