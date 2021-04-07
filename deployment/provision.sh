#!/usr/bin/env bash

# build and deploy mev-frontend web app in Vagrant VM

# print commands and their expanded arguments
set -x

/usr/bin/curl -fsSL https://deb.nodesource.com/setup_15.x | /usr/bin/bash -
/usr/bin/apt-get install -y apache2 nodejs

# to avoid errors caused by high IO in the shared folder
# https://medium.com/@dtinth/isolating-node-modules-in-vagrant-9e646067b36
/usr/sbin/runuser -l vagrant -c "mkdir -p /home/vagrant/node_modules /vagrant/node_modules"
/usr/bin/mount --bind /home/vagrant/node_modules /vagrant/node_modules

/usr/sbin/runuser -l vagrant -c "cd /vagrant && /usr/bin/npm install"
/usr/sbin/runuser -l vagrant -c "cd /vagrant && /usr/bin/npm run build"
/usr/bin/cp -a /vagrant/dist/web-mev/* /var/www/html
