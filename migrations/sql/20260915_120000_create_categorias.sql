-- Categorías de socios (dato maestro) y asignación socio <-> categoría.
-- 100% idempotente y no destructivo: solo crea si no existe.
-- No se elimina ni modifica ninguna tabla, columna o dato existente.
-- PS: socio_tipoSocio (facturación/importe) queda intacto; estas categorías son etiquetas de gestión.

IF OBJECT_ID('dbo.categoria', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.categoria (
        categoria_id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        descripcion NVARCHAR(300) NULL,
        deleted BIT NOT NULL DEFAULT 0,
        creado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX uq_categoria_nombre ON dbo.categoria (nombre);
END;
GO

IF OBJECT_ID('dbo.socio_categoria', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.socio_categoria (
        socio_categoria_id INT IDENTITY(1,1) PRIMARY KEY,
        socio_id BIGINT NOT NULL,
        categoria_id INT NOT NULL,
        creado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE INDEX uq_socio_categoria ON dbo.socio_categoria (socio_id, categoria_id);
END;
GO