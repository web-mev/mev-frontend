#!/usr/bin/env bash

# build and deploy mev-frontend web app on a GCP instance

# print commands and their expanded arguments
set -x

ENVIRONMENT=${environment}
API_ENDPOINT=${backend_url}/api

/usr/bin/curl -fsSL https://deb.nodesource.com/setup_15.x | /usr/bin/bash -
/usr/bin/apt-get install -y apache2 nodejs

/usr/bin/git clone https://github.com/web-mev/mev-frontend.git
cd mev-frontend || exit 1
/usr/bin/npm install

# Depending on the deployment environment, fill-in the appropriate environment.ts file
if [ $ENVIRONMENT = 'prod' ]; then
    sed -e 's?__API_URL__?'"$API_ENDPOINT"'?g' projects/web-mev/src/environments/environment.prod.ts.tmpl > projects/web-mev/src/environments/environment.prod.ts
    /usr/bin/npm run build --configuration=production
else
    sed -e 's?__API_URL__?'"$API_ENDPOINT"'?g' projects/web-mev/src/environments/environment.ts.tmpl > projects/web-mev/src/environments/environment.ts
    /usr/bin/npm run build
fi

# Regardless of the deployment environment, point the JWT file to the API
sed -e 's?__API_URL__?'"$API_ENDPOINT"'?g' projects/web-mev/src/app/jwtConfig.ts.tmpl > projects/web-mev/src/app/jwtConfig.ts

/usr/bin/cp -a dist/web-mev/* /var/www/html
