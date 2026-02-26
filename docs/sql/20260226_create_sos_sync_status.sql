IF OBJECT_ID('dbo.sos_sync_status', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sos_sync_status (
        socio_id INT NOT NULL,
        cuit_cuil VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL,
        last_sync_at DATETIME2 NULL,
        last_error NVARCHAR(1000) NULL,
        updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_sos_sync_status PRIMARY KEY (socio_id, cuit_cuil)
    );

    CREATE INDEX IX_sos_sync_status_updated_at
        ON dbo.sos_sync_status (updated_at DESC);
END
GO
