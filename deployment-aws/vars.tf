variable "backend_hostname" {
  description = "Host name of the API server, for example: api.example.org"
  type        = string
}

variable "https_cert" {
  description = "Identifier for the HTTPS certificate"
  type        = string
}

variable "website_hostname" {
  description = "User-facing host name, for example: www.example.org"
  type        = string
}
