#!/usr/bin/env bash
set -euo pipefail

# ==============================
# Azure bootstrap + Queue setup
# ==============================
# Uso:
# 1) Editá las variables de CONFIG
# 2) Ejecutá: bash azure-setup-commands.sh
#
# Nota: este script crea una arquitectura SIMPLE con Azure Storage Queue.
# Si querés versión "pro" con Service Bus + DLQ, te la armo después.

# ---------- CONFIG ----------
LOCATION="eastus"
RESOURCE_GROUP="camara-comercial-bolivar"
STORAGE_ACCOUNT="stmsg$(date +%s | tail -c 6)"   # debe ser único global y minúsculas
QUEUE_NAME="incoming-messages"

# Si ya sabés tu Subscription ID, pegala acá. Si no, dejá vacío y te deja elegir.
SUBSCRIPTION_ID="67a337c3-ed79-4082-8438-7b2bbc31144f"
# ---------------------------

echo "[1/8] Verificando Azure CLI..."
if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI no está instalada."
  echo "Linux Debian/Ubuntu: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
  echo "macOS: brew install azure-cli"
  echo "Windows: winget install -e --id Microsoft.AzureCLI"
  exit 1
fi

echo "[2/8] Limpiando sesión previa..."
az logout >/dev/null 2>&1 || true
az account clear >/dev/null 2>&1 || true

echo "[3/8] Login con MFA (device code)..."
az login --use-device-code >/dev/null

echo "[4/8] Suscripciones disponibles:"
az account list --all --query "[].{name:name,id:id,tenantId:tenantId,state:state,isDefault:isDefault}" -o table

if [[ -n "${SUBSCRIPTION_ID}" ]]; then
  echo "[5/8] Seleccionando suscripción ${SUBSCRIPTION_ID}..."
  az account set --subscription "${SUBSCRIPTION_ID}"
else
  echo "[5/8] No definiste SUBSCRIPTION_ID."
  echo "Copiá el ID desde la tabla y ejecutá:"
  echo "  az account set --subscription <SUBSCRIPTION_ID>"
  echo "Luego volvés a correr este script si querés automatizar el resto."
  exit 0
fi

echo "Suscripción activa:"
az account show --query "{name:name,id:id,tenantId:tenantId}" -o table

echo "[6/8] Creando Resource Group..."
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  -o table

echo "[7/8] Creando Storage Account..."
az storage account create \
  --name "${STORAGE_ACCOUNT}" \
  --resource-group "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --sku Standard_LRS \
  --kind StorageV2 \
  -o table

echo "[8/8] Creando Queue..."
CONN_STRING=$(az storage account show-connection-string \
  --name "${STORAGE_ACCOUNT}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query connectionString -o tsv)

az storage queue create \
  --name "${QUEUE_NAME}" \
  --connection-string "${CONN_STRING}" \
  -o table

echo

echo "✅ Listo. Recursos creados:"
echo "- Resource Group: ${RESOURCE_GROUP}"
echo "- Storage Account: ${STORAGE_ACCOUNT}"
echo "- Queue: ${QUEUE_NAME}"

echo
echo "Comandos de prueba:"
echo "1) Enviar mensaje"
echo "az storage message put --queue-name ${QUEUE_NAME} --content '{\"hello\":\"world\"}' --connection-string \"\${CONN_STRING}\""
echo
echo "2) Leer mensajes"
echo "az storage message get --queue-name ${QUEUE_NAME} --num-messages 5 --connection-string \"\${CONN_STRING}\""
echo
echo "3) Guardar connection string en variable temporal"
echo "export AZURE_STORAGE_CONNECTION_STRING=\"${CONN_STRING}\""
