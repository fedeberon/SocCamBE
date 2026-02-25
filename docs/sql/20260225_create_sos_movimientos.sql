-- SOS Contador movements/cobros cache table (SQL Server)
-- Ajusta nombres/schema si querés otra convención.

IF OBJECT_ID('dbo.sos_movimientos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sos_movimientos (
        sos_mov_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        socio_id INT NOT NULL,

        -- IDs externos de SOS
        sos_cobro_id BIGINT NULL,
        sos_cliente_id BIGINT NULL,

        -- Datos de cliente
        cuit_cuil VARCHAR(20) NOT NULL,
        cliente_nombre NVARCHAR(255) NULL,
        cliente_email NVARCHAR(255) NULL,

        -- Datos del cobro/movimiento
        fecha DATETIME2 NULL,
        factura NVARCHAR(100) NULL,
        referencia NVARCHAR(500) NULL,
        monto DECIMAL(18,2) NULL,
        periodo NVARCHAR(20) NULL,

        -- Payload completo para auditoría/debug
        raw_json NVARCHAR(MAX) NULL,

        -- Metadata
        source NVARCHAR(50) NOT NULL CONSTRAINT DF_sos_movimientos_source DEFAULT ('SOS_CONTADOR'),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_sos_movimientos_created_at DEFAULT (SYSDATETIME()),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_sos_movimientos_updated_at DEFAULT (SYSDATETIME()),
        deleted BIT NOT NULL CONSTRAINT DF_sos_movimientos_deleted DEFAULT (0)
    );

    -- Evita duplicados por cobro externo + socio
    CREATE UNIQUE INDEX UX_sos_movimientos_socio_cobro
        ON dbo.sos_movimientos (socio_id, sos_cobro_id)
        WHERE sos_cobro_id IS NOT NULL;

    -- Índices de consulta comunes
    CREATE INDEX IX_sos_movimientos_cuit_fecha
        ON dbo.sos_movimientos (cuit_cuil, fecha DESC);

    CREATE INDEX IX_sos_movimientos_socio_fecha
        ON dbo.sos_movimientos (socio_id, fecha DESC);
END
GO

-- Trigger para updated_at automático en UPDATE
IF OBJECT_ID('dbo.trg_sos_movimientos_updated_at', 'TR') IS NULL
BEGIN
    EXEC('CREATE TRIGGER dbo.trg_sos_movimientos_updated_at
    ON dbo.sos_movimientos
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE m
        SET updated_at = SYSDATETIME()
        FROM dbo.sos_movimientos m
        INNER JOIN inserted i ON i.sos_mov_id = m.sos_mov_id;
    END');
END
GO
