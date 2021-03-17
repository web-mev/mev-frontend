#!/usr/bin/env bash

# build and deploy mev-frontend web app on a GCP instance

# print commands and their expanded arguments
set -x

/usr/bin/curl -fsSL https://deb.nodesource.com/setup_15.x | /usr/bin/bash -
/usr/bin/apt-get install -y apache2 nodejs

git clone https://github.com/web-mev/mev-frontend.git
cd mev-frontend || exit 1
/usr/bin/npm install
/usr/bin/npm run build
/usr/bin/cp -a mev-frontend/dist/web-mev/* /var/www/html
