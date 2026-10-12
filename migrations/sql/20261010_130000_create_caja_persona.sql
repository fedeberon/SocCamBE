IF OBJECT_ID('dbo.caja_persona', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.caja_persona (
    caja_persona_id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_caja_persona PRIMARY KEY,
    caja_id INT NOT NULL,
    tipo NVARCHAR(20) NOT NULL,
    nombre NVARCHAR(200) NOT NULL,
    tipo_documento NVARCHAR(50) NULL,
    numero_documento NVARCHAR(50) NULL,
    cuit NVARCHAR(20) NOT NULL,
    calle NVARCHAR(200) NULL,
    numero NVARCHAR(20) NULL,
    piso NVARCHAR(20) NULL,
    depto NVARCHAR(20) NULL,
    cp NVARCHAR(20) NULL,
    ciudad NVARCHAR(100) NULL,
    provincia NVARCHAR(100) NULL,
    telefono NVARCHAR(50) NULL,
    celular NVARCHAR(50) NULL,
    email NVARCHAR(200) NULL,
    id_tarjeta NVARCHAR(100) NULL,
    deleted BIT NOT NULL CONSTRAINT df_caja_persona_deleted DEFAULT 0,
    creado_en DATETIME2 NOT NULL CONSTRAINT df_caja_persona_creado_en DEFAULT GETDATE(),
    modificado_en DATETIME2 NULL
  )
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_caja_persona_caja'
)
  ALTER TABLE dbo.caja_persona
    ADD CONSTRAINT fk_caja_persona_caja FOREIGN KEY (caja_id) REFERENCES dbo.caja_seguridad(caja_id)
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'IX_caja_persona_caja_id' AND object_id = OBJECT_ID('dbo.caja_persona')
)
  CREATE INDEX IX_caja_persona_caja_id ON dbo.caja_persona (caja_id)
GO
