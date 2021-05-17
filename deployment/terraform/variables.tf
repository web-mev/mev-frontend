variable "project_id" {
  description = "GCP project ID"
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

variable "backend_url" {
  description = "The url or IP address (with protocol) of the API. No trailing slash."
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
