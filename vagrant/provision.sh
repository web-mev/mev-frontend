#!/usr/bin/env bash

# build and deploy mev-frontend web app in Vagrant VM

# print commands and their expanded arguments
set -x

set -e

# These environment variables are set by Vagrant
set -o allexport
source /vagrant/$1
set +o allexport

/usr/bin/apt-get update
/usr/bin/apt-get install -y ca-certificates curl gnupg
/usr/bin/mkdir -p /etc/apt/keyrings
/usr/bin/curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | /usr/bin/gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

NODE_MAJOR=16
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" > /etc/apt/sources.list.d/nodesource.list

/usr/bin/apt-get update
/usr/bin/apt-get -y install --no-install-recommends apache2 nodejs

# to avoid errors caused by high IO in the shared folder
# https://medium.com/@dtinth/isolating-node-modules-in-vagrant-9e646067b36
/usr/sbin/runuser -l vagrant -c "mkdir -p /home/vagrant/node_modules /vagrant/node_modules"
/usr/bin/mount --bind /home/vagrant/node_modules /vagrant/node_modules

/usr/sbin/runuser -l vagrant -c "cd /vagrant && /usr/bin/npm install"

# Fill-in the details about JWT, the API url, and sentry's url
cd /vagrant
sed -e 's?__MEV_DOMAIN__?'"$MEV_DOMAIN"'?g' projects/web-mev/src/app/jwtConfig.ts.tmpl > projects/web-mev/src/app/jwtConfig.ts
sed -e 's?__SENTRY_DSN__?'"$MEV_SENTRY_DSN"'?g' projects/web-mev/src/app/sentry-error-handler.ts.tmpl > projects/web-mev/src/app/sentry-error-handler.ts
sed -e 's?__DROPBOX_APP_KEY__?'"$MEV_DROPBOX_APP_KEY"'?g' projects/web-mev/src/index.html.tmpl > projects/web-mev/src/index.html

cp projects/web-mev/src/environments/environment.ts.tmpl environment.ts
sed -i 's?__API_URL__?'"$MEV_API_ENDPOINT"'?g' environment.ts
sed -i 's?__MAX_UPLOAD_SIZE_BYTES__?'"$MEV_MAX_UPLOAD_SIZE_BYTES"'?g' environment.ts
mv environment.ts projects/web-mev/src/environments/environment.ts

/usr/sbin/runuser -l vagrant -c "cd /vagrant && /usr/bin/npm run build"
/usr/bin/cp -a /vagrant/dist/web-mev/* /var/www/html
