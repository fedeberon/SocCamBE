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
LOCATION="eastus2"
RESOURCE_GROUP="camara-comercial-bolivar"
STORAGE_ACCOUNT="intercamstore"         # storage actual (a eliminar si FORCE_RECREATE_STORAGE=true)
NEW_STORAGE_ACCOUNT="intercamstorage"   # nombre correcto deseado en East US 2
QUEUE_NAME="incoming-messages"
CREATE_STORAGE_IF_MISSING="false"       # true para permitir crear uno nuevo
FORCE_RECREATE_STORAGE="false"          # true => elimina STORAGE_ACCOUNT y crea NEW_STORAGE_ACCOUNT

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

echo "[2/8] Verificando sesión actual..."
if az account show >/dev/null 2>&1; then
  echo "Sesión activa detectada. Reutilizando login actual."
else
  echo "No hay sesión activa. Iniciando login con MFA (device code)..."
  az login --use-device-code >/dev/null
fi

echo "[3/8] Suscripciones disponibles:"
az account list --all --query "[].{name:name,id:id,tenantId:tenantId,state:state,isDefault:isDefault}" -o table

if [[ -n "${SUBSCRIPTION_ID}" ]]; then
  echo "[4/8] Seleccionando suscripción ${SUBSCRIPTION_ID}..."
  az account set --subscription "${SUBSCRIPTION_ID}"
else
  echo "[4/8] No definiste SUBSCRIPTION_ID."
  echo "Copiá el ID desde la tabla y ejecutá:"
  echo "  az account set --subscription <SUBSCRIPTION_ID>"
  echo "Luego volvés a correr este script si querés automatizar el resto."
  exit 0
fi

echo "Suscripción activa:"
az account show --query "{name:name,id:id,tenantId:tenantId}" -o table

echo "[5/8] Verificando Resource Group..."
if az group show --name "${RESOURCE_GROUP}" >/dev/null 2>&1; then
  RG_LOCATION=$(az group show --name "${RESOURCE_GROUP}" --query location -o tsv)
  echo "Resource Group ya existe: ${RESOURCE_GROUP} (location=${RG_LOCATION})"
else
  echo "Resource Group no existe. Creándolo..."
  az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    -o table
  RG_LOCATION="${LOCATION}"
fi

echo "[6/8] Verificando Storage Account..."
if [[ "${FORCE_RECREATE_STORAGE}" == "true" ]]; then
  echo "FORCE_RECREATE_STORAGE=true: se eliminará '${STORAGE_ACCOUNT}' (si existe) y se creará '${NEW_STORAGE_ACCOUNT}' en ${LOCATION}."

  if az storage account show --name "${STORAGE_ACCOUNT}" --resource-group "${RESOURCE_GROUP}" >/dev/null 2>&1; then
    echo "Eliminando storage existente: ${STORAGE_ACCOUNT} ..."
    az storage account delete \
      --name "${STORAGE_ACCOUNT}" \
      --resource-group "${RESOURCE_GROUP}" \
      --yes

    echo "Esperando borrado completo..."
    while az storage account show --name "${STORAGE_ACCOUNT}" --resource-group "${RESOURCE_GROUP}" >/dev/null 2>&1; do
      sleep 5
      echo "...aún eliminando ${STORAGE_ACCOUNT}"
    done
  else
    echo "Storage '${STORAGE_ACCOUNT}' no existe, se omite borrado."
  fi

  STORAGE_ACCOUNT="${NEW_STORAGE_ACCOUNT}"
  echo "Creando storage nuevo: ${STORAGE_ACCOUNT} en ${LOCATION} ..."
  az storage account create \
    --name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku Standard_LRS \
    --kind StorageV2 \
    -o table
else
  if az storage account show --name "${STORAGE_ACCOUNT}" --resource-group "${RESOURCE_GROUP}" >/dev/null 2>&1; then
    echo "Storage Account ya existe: ${STORAGE_ACCOUNT}"
  else
    if [[ "${CREATE_STORAGE_IF_MISSING}" == "true" ]]; then
      echo "Storage Account no existe. Creándolo..."
      az storage account create \
        --name "${STORAGE_ACCOUNT}" \
        --resource-group "${RESOURCE_GROUP}" \
        --location "${RG_LOCATION}" \
        --sku Standard_LRS \
        --kind StorageV2 \
        -o table
    else
      echo "ERROR: Storage Account '${STORAGE_ACCOUNT}' no existe en RG '${RESOURCE_GROUP}'."
      echo "Para evitar costos/recursos extra, CREATE_STORAGE_IF_MISSING=false bloquea la creación automática."
      echo "Si querés crearlo automáticamente, cambiá CREATE_STORAGE_IF_MISSING=\"true\" y reintentá."
      exit 1
    fi
  fi
fi

echo "[7/8] Creando Queue..."
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
echo "3) Guardar connection string en variables temporales"
echo "export AZURE_BLOB_STORAGE_CONNECTION=\"${CONN_STRING}\""
echo "export AZURE_QUEUE_STORAGE_CONNECTION=\"${CONN_STRING}\""
echo "export AZURE_QUEUE_NAME=\"${QUEUE_NAME}\""
echo "export SOS_QUEUE_WORKER_MODE=loop"
echo "export SOS_QUEUE_WORKER_POLL_MS=15000"
echo

echo "4) Levantar worker local (desde SocCamBE)"
echo "npm run worker:sos-queue"
