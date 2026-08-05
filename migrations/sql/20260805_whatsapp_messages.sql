IF OBJECT_ID('dbo.whatsapp_messages', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.whatsapp_messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chat_id NVARCHAR(255) NOT NULL,
    chat_name NVARCHAR(255) NULL,
    phone_number NVARCHAR(50) NULL,
    message NVARCHAR(MAX) NULL,
    from_me BIT NOT NULL DEFAULT 0,
    message_timestamp DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );

  CREATE INDEX IX_whatsapp_messages_chat_id ON dbo.whatsapp_messages(chat_id);
  CREATE INDEX IX_whatsapp_messages_timestamp ON dbo.whatsapp_messages(message_timestamp);
END
