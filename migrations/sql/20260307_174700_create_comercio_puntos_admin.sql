IF OBJECT_ID('dbo.comercio_puntos_admin', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.comercio_puntos_admin (
    comercio_puntos_admin_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    comercio_id INT NOT NULL,
    socio_id BIGINT NOT NULL,
    fecha_alta DATETIME NOT NULL DEFAULT(GETDATE())
  );

  CREATE UNIQUE INDEX ux_comercio_puntos_admin_comercio_socio
    ON dbo.comercio_puntos_admin (comercio_id, socio_id);

  ALTER TABLE dbo.comercio_puntos_admin
    ADD CONSTRAINT FK_comercio_puntos_admin_comercio
    FOREIGN KEY (comercio_id) REFERENCES dbo.comercio_puntos(comercio_id);

  ALTER TABLE dbo.comercio_puntos_admin
    ADD CONSTRAINT FK_comercio_puntos_admin_socio
    FOREIGN KEY (socio_id) REFERENCES dbo.socio(socio_id);
END;
