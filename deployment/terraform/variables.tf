variable "project_id" {
  description = "GCP project ID"
}

variable "environment" {
  description = "Sets which environment (dev, prod) we are deploying in. If the value is not 'prod', then it is ignored."
}

variable "commit_id" {
  description = "The git commit hash to deploy"
}

variable "credentials_file" {
  description = "Path to JSON file with GCP service account key"
}

variable "region" {
  default = "us-east4"
}

variable "zone" {
  default = "us-east4-c"
}

variable "domain" {
  description = "The domain we want to deploy for. No final dot like in DNS records. For example, sub-domain.example.com"
}

variable "managed_dns_zone" {
  description = "The GCP managed zone. Only the short name- NOT the long, url-like string."
}

variable "backend_domain" {
  description = "The domain where the api is served from. NOT the full API url. Do NOT include protocol."
}

variable "backend_protocol" {
  description = "The protocol (http/s) for the backend domain"
  default = "https"
}

variable "api_root" {
  description = "The url of the backend API, relative to the domain. For example, if the api is located at https://example.org/api, then this value is simply /api"
  default = "/api"
}

variable "google_oauth_client_id" {
  description = "The ID of the OAuth2 client to use. Something like <client ID>.apps.googleusercontent.com"
}

variable "sentry_dsn" {
  description = "The DSN of the Sentry application. Include the protocol. Something like http://<id>@<domain>:9000/2 or similar"
}

variable "dropbox_app_key" {
  description = "The public app key for the Dropbox chooser."
}

variable "ssl_cert" {
  description = "The identifiers for the SSL certificate to use for the load balancer."
}

variable "analytics_tag" {
  description = "The key to associate the page with a particular google analytics stream. Like G-XXXXXX"
}

variable "max_upload_size_bytes" {
  description = "The maximum size permitted for basic https file uploads."
  default = 268435456
}
