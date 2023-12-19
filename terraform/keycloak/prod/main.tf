data "keycloak_realm" "pltsvc" {
  realm = "platform-services"
}

resource "keycloak_openid_client" "pltsvc" {
  realm_id  = data.keycloak_realm.pltsvc.id
  client_id = "pltsvc"

  name    = "platform registry app"
  enabled = true

  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = false

  access_type = "CONFIDENTIAL"
  valid_redirect_uris = [
    "https://pltsvc.apps.silver.devops.gov.bc.ca/*"
  ]
}