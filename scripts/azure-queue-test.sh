#!/usr/bin/env bash
set -euo pipefail

# Test rápido para Azure Queue Storage
# Requiere:
#   AZURE_QUEUE_STORAGE_CONNECTION
#   AZURE_QUEUE_NAME (opcional, default incoming-messages)

QUEUE_NAME="${AZURE_QUEUE_NAME:-incoming-messages}"
CONN="${AZURE_QUEUE_STORAGE_CONNECTION:-}"

if [[ -z "${CONN}" ]]; then
  echo "ERROR: faltan variables. Exportá AZURE_QUEUE_STORAGE_CONNECTION."
  exit 1
fi

echo "Queue: ${QUEUE_NAME}"
az storage queue create --name "${QUEUE_NAME}" --connection-string "${CONN}" -o table

echo "Enviando mensaje de prueba..."
az storage message put \
  --queue-name "${QUEUE_NAME}" \
  --content '{"jobType":"sync_sos_movimientos","socioId":999,"cuit":"20000000001","trigger":"manual"}' \
  --connection-string "${CONN}" \
  -o table

echo "Leyendo hasta 5 mensajes..."
az storage message get \
  --queue-name "${QUEUE_NAME}" \
  --num-messages 5 \
  --connection-string "${CONN}" \
  -o table

echo "OK"
