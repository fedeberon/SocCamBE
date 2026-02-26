#!/usr/bin/env bash
set -euo pipefail

# Deploy productivo del worker SOS Queue como servicio systemd
# Uso:
#   sudo bash scripts/deploy-sos-worker.sh
#
# Opcional por variables de entorno antes de ejecutar:
#   APP_DIR=/opt/SocCamBE
#   SERVICE_NAME=soccambe-sos-worker
#   APP_USER=fede
#   APP_GROUP=fede
#   NODE_BIN=/usr/bin/node

APP_DIR="${APP_DIR:-/home/fede/.openclaw/workspace/SocCamBE}"
SERVICE_NAME="${SERVICE_NAME:-soccambe-sos-worker}"
APP_USER="${APP_USER:-fede}"
APP_GROUP="${APP_GROUP:-$APP_USER}"
NODE_BIN="${NODE_BIN:-$(command -v node)}"
ENV_FILE="${APP_DIR}/.env"

if [[ $EUID -ne 0 ]]; then
  echo "ERROR: ejecutá con sudo/root"
  exit 1
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "ERROR: APP_DIR no existe: ${APP_DIR}"
  exit 1
fi

if [[ -z "${NODE_BIN}" || ! -x "${NODE_BIN}" ]]; then
  echo "ERROR: no encuentro node binario. Definí NODE_BIN=/ruta/a/node"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: falta ${ENV_FILE}. Crealo con variables productivas antes de deployar."
  exit 1
fi

echo "[1/7] Instalando dependencias productivas..."
cd "${APP_DIR}"
npm ci --omit=dev

echo "[2/7] Compilando TypeScript..."
npm run build

echo "[3/7] Validando vars críticas en .env (solo worker)..."
required_vars=(
  "AZURE_QUEUE_STORAGE_CONNECTION"
  "AZURE_QUEUE_NAME"
  "SOS_AUTH_USERNAME"
  "SOS_AUTH_PASSWORD"
)
for var in "${required_vars[@]}"; do
  if ! grep -qE "^${var}=" "${ENV_FILE}"; then
    echo "ERROR: falta ${var} en ${ENV_FILE}"
    exit 1
  fi
done

echo "[4/7] Escribiendo unit file systemd..."
UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
cat > "${UNIT_PATH}" <<EOF
[Unit]
Description=SocCamBE SOS Queue Worker
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
Environment=NODE_ENV=production
Environment=SOS_QUEUE_WORKER_MODE=loop
Environment=SOS_QUEUE_WORKER_POLL_MS=15000
ExecStart=${NODE_BIN} dist/workers/sosQueueWorker.js
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "[5/7] Recargando systemd..."
systemctl daemon-reload

echo "[6/7] Habilitando e iniciando servicio..."
systemctl enable --now "${SERVICE_NAME}"

echo "[7/7] Estado servicio"
systemctl --no-pager --full status "${SERVICE_NAME}" || true

echo
echo "✅ Deploy listo"
echo "Logs: journalctl -u ${SERVICE_NAME} -f"
echo "Restart: systemctl restart ${SERVICE_NAME}"
echo "Stop: systemctl stop ${SERVICE_NAME}"
