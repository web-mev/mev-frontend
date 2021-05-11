# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/focal64"

  config.vm.hostname = "mev-frontend"

  config.vm.network "forwarded_port", guest: 80, host: 8080
  config.vm.network "forwarded_port", guest: 4200, host: 4200

  config.vm.provider "virtualbox" do |vb|
    vb.memory = 4096
    vb.cpus = 1
  end

  config.vm.provision :shell do |s| 
    s.path = "vagrant/provision.sh"
    s.env = {
      API_ENDPOINT:ENV['MEV_API'],
      GOOGLE_OAUTH_CLIENT_ID:ENV['MEV_GOOGLE_OAUTH_CLIENT_ID'],
      SENTRY_DSN:ENV['MEV_SENTRY_DSN']
    }
  end
end
