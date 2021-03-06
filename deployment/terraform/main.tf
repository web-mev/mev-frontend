terraform {
  required_version = "~> 0.14.8"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 3.60.0"
    }
  }
}

provider "google" {
  credentials = file(var.credentials_file)
  project     = var.project_id
  region      = var.region
  zone        = var.zone
}

resource "google_compute_network" "mev_frontend_network" {
  name = "webmev-${terraform.workspace}-frontend-network"
}

resource "google_compute_firewall" "mev_firewall" {
  name    = "webmev-${terraform.workspace}-frontend-firewall"
  network = google_compute_network.mev_frontend_network.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  target_tags = ["allow-ssh"]

}

resource "google_compute_firewall" "allow_hc_firewall" {
  name    = "webmev-${terraform.workspace}-healthcheck-firewall"
  network = google_compute_network.mev_frontend_network.name

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  direction = "INGRESS"
  source_ranges = ["130.211.0.0/22","35.191.0.0/16"]
  target_tags = ["allow-health-check"]

}

resource "google_compute_global_address" "lb-static-ip" {
  name = "webmev-${terraform.workspace}-lb-static-address"
}

resource "google_compute_instance" "mev_frontend" {
  name                    = "webmev-${terraform.workspace}-frontend"
  machine_type            = "e2-standard-2"
  tags                    = ["allow-ssh", "allow-health-check"]

  metadata_startup_script = templatefile("provision.sh",
    {
      environment = terraform.workspace,
      backend_url = var.backend_url,
      google_oauth_client_id = var.google_oauth_client_id,
      sentry_dsn = var.sentry_dsn,
      dropbox_app_key = var.dropbox_app_key,
      analytics_tag = var.analytics_tag
    }
  )

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
    }
  }

  network_interface {
    network = google_compute_network.mev_frontend_network.name
    access_config {
    }
  }
}

resource "google_dns_record_set" "set" {
  name         = "${var.domain}."
  type         = "A"
  ttl          = 600
  managed_zone = var.managed_dns_zone
  rrdatas      = [google_compute_global_address.lb-static-ip.address]
}

resource "google_compute_instance_group" "frontend_ig" {
  name        = "frontend-${terraform.workspace}-ig"
  description = "Instance group for the frontend server"

  instances = [
    google_compute_instance.mev_frontend.id
  ]

  named_port {
    name = "http"
    port = "80"
  }

  zone = var.zone
}


resource "google_compute_health_check" "http-health-check" {
  name = "frontend-${terraform.workspace}-health-check"

  timeout_sec        = 2
  check_interval_sec = 5

  http_health_check {
    port = "80"
    port_name = "http"
    request_path = "/"
  }
}

resource "google_compute_backend_service" "frontend_service" {
  name          = "mev-${terraform.workspace}-frontend-service"
  health_checks = [google_compute_health_check.http-health-check.id]
  protocol = "HTTP"
  port_name = "http"
  load_balancing_scheme = "EXTERNAL"
  backend {
    group = google_compute_instance_group.frontend_ig.self_link
    balancing_mode = "UTILIZATION"
    capacity_scaler = 1.0
    max_utilization = 0.8
  }
}

resource "google_compute_url_map" "urlmap" {
  name = "mev-${terraform.workspace}-frontend-urlmap"

  default_service = google_compute_backend_service.frontend_service.id

  host_rule {
    hosts = [var.domain]
    path_matcher = "frontend-${terraform.workspace}-pm"
  }

  path_matcher {
    name = "frontend-${terraform.workspace}-pm"
    default_service = google_compute_backend_service.frontend_service.id

    path_rule {
      paths = ["/"]
      service = google_compute_backend_service.frontend_service.id
    }

  }
}

resource "google_compute_target_https_proxy" "mev_frontend_lb" {
  name             = "frontend-${terraform.workspace}-https-proxy"
  url_map          = google_compute_url_map.urlmap.id
  ssl_certificates = [var.ssl_cert]
}


resource "google_compute_global_forwarding_rule" "https_fwd" {
  name       = "webmev-frontend-${terraform.workspace}-forwarding-rule"
  target     = google_compute_target_https_proxy.mev_frontend_lb.id
  port_range = 443
  ip_address = google_compute_global_address.lb-static-ip.address
}

  
resource "google_compute_url_map" "https_redirect" {
  name            = "webmev-frontend-${terraform.workspace}-https-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "https_redirect" {
  name   = "webmev-frontend-${terraform.workspace}-http-proxy"
  url_map          = google_compute_url_map.https_redirect.id
}

resource "google_compute_global_forwarding_rule" "https_redirect" {
  name   = "webmev-frontend-${terraform.workspace}-lb-http"

  target = google_compute_target_http_proxy.https_redirect.id
  port_range = "80"
  ip_address = google_compute_global_address.lb-static-ip.address
}

