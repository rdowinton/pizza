resource "auth0_client" "pizza42" {
  name = "Pizza 42"
  description = "Developer's favourite pizzas"
  app_type = "spa"
  initiate_login_uri = local.baseUrl
  callbacks = [local.baseUrl]
  allowed_origins = [local.baseUrl]
  web_origins = [local.baseUrl]
  allowed_logout_urls = [local.baseUrl]
}

resource "auth0_resource_server" "pizza42" {
  name        = "Pizza 42"
  identifier  = "https://pizza.auth.yoga/api"
  signing_alg = "RS256"

  scopes {
    value       = "create:orders"
    description = "Create orders"
  }

  allow_offline_access                            = false
  token_lifetime                                  = 86400
  skip_consent_for_verifiable_first_party_clients = true
  enforce_policies                                = true
}

resource "auth0_role" "email_verified" {
  name = "Email verified"
  description = "Email verified users"

  permissions {
    resource_server_identifier = "${auth0_resource_server.pizza42.identifier}"
    name = "create:orders"
  }
}

resource "auth0_rule" "assign_email_verified_role" {
  name = "assign email verified role"
  script = <<EOF
function (user, context, callback) {
  const permissions = user.permissions || [];
  if(user.email_verified && !permissions.includes(p => p === 'create:orders')) {
    const ManagementClient = require('auth0@2.32.0').ManagementClient;
    const mc = new ManagementClient({ token: auth0.accessToken, domain: auth0.domain });
    mc.users.assignRoles({ id: user.user_id }, { roles: ['${auth0_role.email_verified.id}'] }, err => {
      if(err) {
        callback(new Error('Failed to assign role'));
      }
    });
  }
  callback(null, user, context);
}
EOF
  enabled = true
}

resource "auth0_rule" "add_orders_to_id_token" {
  name = "add orders to ID token"
  script = <<EOF
function (user, context, callback) {
  if(user.user_metadata && user.user_metadata.orders) {
    context.idToken['https://pizza.auth.yoga/orders'] = user.user_metadata.orders;
  }
  callback(null, user, context);
}
EOF
  enabled = true
}

resource "auth0_client" "pizza42_management_api" {
  name = "Pizza 42 Management API"
  description = "Management API client for Pizza 42"
  app_type = "non_interactive"
}

resource "auth0_client_grant" "pizza42_management_api_grant" {
  client_id = "${auth0_client.pizza42_management_api.client_id}"
  audience = "https://${local.auth0Domain}/api/v2/"
  scope = ["read:users", "update:users"]
}