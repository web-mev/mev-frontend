#!/usr/bin/env bash

set -x

/usr/bin/apt-get install -y apache2 build-essential xz-utils
mkdir /opt/software
cd /opt/software
wget https://nodejs.org/dist/v14.3.0/node-v14.3.0-linux-x64.tar.xz && tar -xf node-v14.3.0-linux-x64.tar.xz
export PATH=/opt/software/node-v14.3.0-linux-x64/bin:$PATH

# to avoid errors caused by high IO in the shared folder
# https://medium.com/@dtinth/isolating-node-modules-in-vagrant-9e646067b36
/usr/sbin/runuser -l vagrant -c "mkdir -p /home/vagrant/node_modules /vagrant/node_modules"
/usr/bin/mount --bind /home/vagrant/node_modules /vagrant/node_modules

/usr/sbin/runuser -l vagrant -c "cd /vagrant && /opt/software/node-v14.3.0-linux-x64/bin/npm install"
/usr/sbin/runuser -l vagrant -c "cd /vagrant && /opt/software/node-v14.3.0-linux-x64/bin/npm run build"
/usr/bin/cp -a /vagrant/dist/web-mev/* /var/www/html
