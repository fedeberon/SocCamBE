terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.116"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

data "azurerm_storage_account" "main" {
  name                = var.storage_account_name
  resource_group_name = data.azurerm_resource_group.main.name
}

data "azurerm_service_plan" "functions" {
  name                = var.function_service_plan_name
  resource_group_name = data.azurerm_resource_group.main.name
}

data "azurerm_linux_function_app" "existing" {
  name                = var.function_app_name
  resource_group_name = data.azurerm_resource_group.main.name
}

resource "azurerm_storage_queue" "incoming_messages" {
  name                 = var.queue_name
  storage_account_name = data.azurerm_storage_account.main.name
}

locals {
  enforced_function_app_settings = {
    FUNCTIONS_WORKER_RUNTIME       = "node"
    FUNCTIONS_EXTENSION_VERSION    = "~4"
    AZURE_QUEUE_NAME               = azurerm_storage_queue.incoming_messages.name
    AZURE_QUEUE_STORAGE_CONNECTION = data.azurerm_storage_account.main.primary_connection_string
    AzureWebJobsStorage            = data.azurerm_storage_account.main.primary_connection_string
  }

  function_app_settings = merge(
    try(data.azurerm_linux_function_app.existing.app_settings, {}),
    var.function_app_settings,
    local.enforced_function_app_settings
  )
}

resource "azurerm_linux_function_app" "sos_sync" {
  name                = var.function_app_name
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  service_plan_id     = data.azurerm_service_plan.functions.id

  storage_account_name       = data.azurerm_storage_account.main.name
  storage_account_access_key = data.azurerm_storage_account.main.primary_access_key

  https_only = true

  site_config {
    minimum_tls_version = "1.2"
    ftps_state          = "FtpsOnly"

    application_stack {
      node_version = var.function_node_version
    }
  }

  app_settings = local.function_app_settings

  identity {
    type = "SystemAssigned"
  }

  lifecycle {
    ignore_changes = [
      # Lo cambia cada publish zip de Functions.
      app_settings["WEBSITE_RUN_FROM_PACKAGE"],
    ]
  }
}

variable "resource_group_name" {
  description = "Resource Group donde vive la infra existente."
  type        = string
  default     = "camara-comercial-bolivar"
}

variable "storage_account_name" {
  description = "Storage Account existente que usa backend/function."
  type        = string
  default     = "intercamstorage"
}

variable "queue_name" {
  description = "Queue usada para encolar jobs SOS."
  type        = string
  default     = "incoming-messages"
}

variable "function_service_plan_name" {
  description = "App Service Plan existente de la Function App."
  type        = string
  default     = "EastUS2LinuxDynamicPlan"
}

variable "function_app_name" {
  description = "Function App existente a gestionar con Terraform."
  type        = string
  default     = "soccam-sos-sync-67a337c3"
}

variable "function_node_version" {
  description = "Versión de Node para la Function App."
  type        = string
  default     = "22"
}

variable "function_app_settings" {
  description = "Settings adicionales requeridos por la Function (DB_*, SOS_*)."
  type        = map(string)
  default     = {}
  sensitive   = true
}

output "resource_group_name" {
  value = data.azurerm_resource_group.main.name
}

output "storage_account_name" {
  value = data.azurerm_storage_account.main.name
}

output "queue_name" {
  value = azurerm_storage_queue.incoming_messages.name
}

output "function_app_name" {
  value = azurerm_linux_function_app.sos_sync.name
}
