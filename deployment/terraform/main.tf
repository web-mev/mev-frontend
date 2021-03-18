terraform {
  required_version = "~> 0.14.8"
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "~> 3.60.0"
    }
  }
}

provider "google" {
  credentials = file(var.credentials_file)
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

resource "google_compute_network" "mev_vpc_network" {
  name = "dev-webmev-network"
}

resource "google_compute_firewall" "mev_firewall" {
  name    = "dev-webmev-firewall"
  network = google_compute_network.mev_vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80"]
  }
}

resource "google_compute_instance" "mev_frontend" {
  name         = "dev-webmev-frontend"
  machine_type = "e2-medium"
  tags         = ["web", "dev"]
  metadata_startup_script = file("provision.sh")

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
    }
  }

  network_interface {
    network = google_compute_network.mev_vpc_network.name
    access_config {
      // to give the VM an external ip address
    }
  }
}
