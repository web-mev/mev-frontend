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
