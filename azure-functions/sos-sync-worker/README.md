# SOS Sync Worker (Azure Function + Storage Queue)

Function App para desacoplar la sincronización con SOS Contador del request web.

## Qué hace hoy

- Trigger: Azure Storage Queue (`AZURE_QUEUE_NAME`)
- Valida payload mínimo (`socioId`, `cuit`)
- Marca estado en `dbo.sos_sync_status` (plumbing end-to-end)

> Próximo paso: mover acá la lógica real de `sosContador.service` para traer movimientos/cobros y hacer upsert en `dbo.sos_movimientos`.

## Estructura

- `SosSyncTrigger/function.json` → binding de Storage Queue
- `SosSyncTrigger/index.js` → worker
- `host.json` → config de Function host
- `local.settings.example.json` → variables necesarias

## Ejecutar local

1. Instalar Azure Functions Core Tools (`func`)
2. Copiar `local.settings.example.json` a `local.settings.json` y completar valores
3. `npm install`
4. `npm start`

## Mensaje esperado en cola

```json
{
  "jobType": "sync_sos_movimientos",
  "socioId": 91173,
  "cuit": "20285640661",
  "fechaDesde": "2024-01-01",
  "fechaHasta": "2026-12-31",
  "requestedAt": "2026-02-26T09:55:00Z"
}
```

## Integración con BE (siguiente)

En el backend, al login/selección de socio:
- encolar mensaje en `incoming-messages` (o valor de `AZURE_QUEUE_NAME`)
- responder inmediatamente desde DB local
- frontend consulta estado por `sos_sync_status`
