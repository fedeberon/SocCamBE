IF OBJECT_ID('dbo.campania', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.campania (
    campania_id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_campania PRIMARY KEY,
    nombre NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(2000) NULL,
    logo_url NVARCHAR(500) NULL,
    imagen_url NVARCHAR(500) NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado NVARCHAR(20) NOT NULL CONSTRAINT df_campania_estado DEFAULT 'borrador',
    descuento NVARCHAR(100) NULL,
    terminos NVARCHAR(2000) NULL,
    creado_en DATETIME2 NOT NULL CONSTRAINT df_campania_creado_en DEFAULT GETDATE(),
    modificado_en DATETIME2 NULL
  )
END
GO

IF OBJECT_ID('dbo.socio_campania', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.socio_campania (
    socio_campania_id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_socio_campania PRIMARY KEY,
    socio_id BIGINT NOT NULL,
    campania_id INT NOT NULL,
    estado NVARCHAR(20) NOT NULL CONSTRAINT df_socio_campania_estado DEFAULT 'pendiente',
    aceptado_en DATETIME2 NULL,
    notas NVARCHAR(500) NULL,
    creado_en DATETIME2 NOT NULL CONSTRAINT df_socio_campania_creado_en DEFAULT GETDATE()
  )
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_socio_campania_socio'
)
  ALTER TABLE dbo.socio_campania
    ADD CONSTRAINT fk_socio_campania_socio FOREIGN KEY (socio_id) REFERENCES dbo.socio(socio_id)
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_socio_campania_campania'
)
  ALTER TABLE dbo.socio_campania
    ADD CONSTRAINT fk_socio_campania_campania FOREIGN KEY (campania_id) REFERENCES dbo.campania(campania_id)
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'uq_socio_campania' AND object_id = OBJECT_ID('dbo.socio_campania')
)
  CREATE UNIQUE INDEX uq_socio_campania ON dbo.socio_campania (socio_id, campania_id)
GO