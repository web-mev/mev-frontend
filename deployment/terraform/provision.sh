#!/usr/bin/env bash

# build and deploy mev-frontend web app on a GCP instance

# print commands and their expanded arguments
set -x

ENVIRONMENT=${environment}
API_ENDPOINT=${backend_url}/api
GOOGLE_OAUTH_CLIENT_ID=${google_oauth_client_id}
SENTRY_DSN=${sentry_dsn}
DROPBOX_APP_KEY=${dropbox_app_key}
ANALYTICS_TAG=${analytics_tag}

/usr/bin/curl -fsSL https://deb.nodesource.com/setup_16.x | /usr/bin/bash -
/usr/bin/apt-get install -y apache2 nodejs

/usr/bin/git clone https://github.com/web-mev/mev-frontend.git
cd mev-frontend || exit 1
/usr/bin/npm install

# Regardless of the deployment environment, point the JWT file to the API
sed -e 's?__API_URL__?'"$API_ENDPOINT"'?g' projects/web-mev/src/app/jwtConfig.ts.tmpl > projects/web-mev/src/app/jwtConfig.ts
sed -e 's?__SENTRY_DSN__?'"$SENTRY_DSN"'?g' projects/web-mev/src/app/sentry-error-handler.ts.tmpl > projects/web-mev/src/app/sentry-error-handler.ts
sed -e 's?__DROPBOX_APP_KEY__?'"$DROPBOX_APP_KEY"'?g' projects/web-mev/src/index.html.tmpl > projects/web-mev/src/index.html
sed -i 's?__ANALYTICS_TAG__?'"$ANALYTICS_TAG"'?g' projects/web-mev/src/index.html

# Depending on the deployment environment, fill-in the appropriate environment.ts file
if [ $ENVIRONMENT = 'prod' ]; then
    cp projects/web-mev/src/environments/environment.prod.ts.tmpl environment.prod.ts
    sed -i 's?__API_URL__?'"$API_ENDPOINT"'?g' environment.prod.ts
    sed -i 's?__GOOGLE_OAUTH_CLIENT_ID__?'"$GOOGLE_OAUTH_CLIENT_ID"'?g' environment.prod.ts
    mv environment.prod.ts projects/web-mev/src/environments/environment.prod.ts

    # without this, the build complains that it can't find environment. 
    # TODO: is the --configuration=production flag actually working as we expect?
    cp projects/web-mev/src/environments/environment.prod.ts projects/web-mev/src/environments/environment.ts
    /usr/bin/npm run build --configuration=production
else
    cp projects/web-mev/src/environments/environment.ts.tmpl environment.ts
    sed -i 's?__API_URL__?'"$API_ENDPOINT"'?g' environment.ts
    sed -i 's?__GOOGLE_OAUTH_CLIENT_ID__?'"$GOOGLE_OAUTH_CLIENT_ID"'?g' environment.ts
    mv environment.ts projects/web-mev/src/environments/environment.ts
    /usr/bin/npm run build
fi

/usr/bin/cp -a dist/web-mev/* /var/www/html
