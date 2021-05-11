#!/usr/bin/env bash

# build and deploy mev-frontend web app in Vagrant VM

# print commands and their expanded arguments
set -x

set -e

# These environment variables are set by Vagrant
set -o allexport
API_ENDPOINT=${API_ENDPOINT}/api
GOOGLE_OAUTH_CLIENT_ID=${GOOGLE_OAUTH_CLIENT_ID}
SENTRY_DSN=${SENTRY_DSN}
set +o allexport

/usr/bin/curl -fsSL https://deb.nodesource.com/setup_15.x | /usr/bin/bash -
/usr/bin/apt-get install -y apache2 nodejs

# to avoid errors caused by high IO in the shared folder
# https://medium.com/@dtinth/isolating-node-modules-in-vagrant-9e646067b36
/usr/sbin/runuser -l vagrant -c "mkdir -p /home/vagrant/node_modules /vagrant/node_modules"
/usr/bin/mount --bind /home/vagrant/node_modules /vagrant/node_modules

/usr/sbin/runuser -l vagrant -c "cd /vagrant && /usr/bin/npm install"

# Fill-in the details about JWT, the API url, and sentry's url
cd /vagrant
sed -e 's?__API_URL__?'"$API_ENDPOINT"'?g' projects/web-mev/src/app/jwtConfig.ts.tmpl > projects/web-mev/src/app/jwtConfig.ts
sed -e 's?__SENTRY_DSN__?'"$SENTRY_DSN"'?g' projects/web-mev/src/app/sentry-error-handler.ts.tmpl > projects/web-mev/src/app/sentry-error-handler.ts

cp projects/web-mev/src/environments/environment.ts.tmpl environment.ts
sed -i 's?__API_URL__?'"$API_ENDPOINT"'?g' environment.ts
sed -i 's?__GOOGLE_OAUTH_CLIENT_ID__?'"$GOOGLE_OAUTH_CLIENT_ID"'?g' environment.ts
mv environment.ts projects/web-mev/src/environments/environment.ts

/usr/sbin/runuser -l vagrant -c "cd /vagrant && /usr/bin/npm run build"
/usr/bin/cp -a /vagrant/dist/web-mev/* /var/www/html
