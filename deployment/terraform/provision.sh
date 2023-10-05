#!/usr/bin/env bash

# build and deploy mev-frontend web app on a GCP instance

# print commands and their expanded arguments
set -x

ENVIRONMENT=${environment}
BACKEND_DOMAIN=${backend_domain}
API_ENDPOINT=${api_endpoint}
GOOGLE_OAUTH_CLIENT_ID=${google_oauth_client_id}
SENTRY_DSN=${sentry_dsn}
DROPBOX_APP_KEY=${dropbox_app_key}
ANALYTICS_TAG=${analytics_tag}
GIT_COMMIT=${commit_id}
MAX_UPLOAD_SIZE_BYTES=${max_upload_size_bytes}

apt-get update
apt-get install -y ca-certificates curl gnupg
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

NODE_MAJOR=18
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" > /etc/apt/sources.list.d/nodesource.list

apt-get update
apt-get -y install --no-install-recommends apache2 nodejs

/usr/bin/git clone https://github.com/web-mev/mev-frontend.git
cd mev-frontend || exit 1
git checkout -q $GIT_COMMIT
/usr/bin/npm install

# Regardless of the deployment environment, point the JWT file to the API
sed -e 's?__MEV_DOMAIN__?'"$BACKEND_DOMAIN"'?g' projects/web-mev/src/app/jwtConfig.ts.tmpl > projects/web-mev/src/app/jwtConfig.ts
sed -e 's?__SENTRY_DSN__?'"$SENTRY_DSN"'?g' projects/web-mev/src/app/sentry-error-handler.ts.tmpl > projects/web-mev/src/app/sentry-error-handler.ts
sed -e 's?__DROPBOX_APP_KEY__?'"$DROPBOX_APP_KEY"'?g' projects/web-mev/src/index.html.tmpl > projects/web-mev/src/index.html
sed -i 's?__ANALYTICS_TAG__?'"$ANALYTICS_TAG"'?g' projects/web-mev/src/index.html

# Depending on the deployment environment, fill-in the appropriate environment.ts file
if [ $ENVIRONMENT = 'prod' ]; then
    cp projects/web-mev/src/environments/environment.prod.ts.tmpl environment.prod.ts
    sed -i 's?__API_URL__?'"$API_ENDPOINT"'?g' environment.prod.ts
    sed -i 's?__GOOGLE_OAUTH_CLIENT_ID__?'"$GOOGLE_OAUTH_CLIENT_ID"'?g' environment.prod.ts
    sed -i 's?__MAX_UPLOAD_SIZE_BYTES__?'"$MAX_UPLOAD_SIZE_BYTES"'?g' environment.prod.ts
    mv environment.prod.ts projects/web-mev/src/environments/environment.prod.ts

    # without this, the build complains that it can't find environment. 
    # TODO: is the --configuration=production flag actually working as we expect?
    cp projects/web-mev/src/environments/environment.prod.ts projects/web-mev/src/environments/environment.ts
    /usr/bin/npm run build --configuration=production
else
    cp projects/web-mev/src/environments/environment.ts.tmpl environment.ts
    sed -i 's?__API_URL__?'"$API_ENDPOINT"'?g' environment.ts
    sed -i 's?__GOOGLE_OAUTH_CLIENT_ID__?'"$GOOGLE_OAUTH_CLIENT_ID"'?g' environment.ts
    sed -i 's?__MAX_UPLOAD_SIZE_BYTES__?'"$MAX_UPLOAD_SIZE_BYTES"'?g' environment.ts
    mv environment.ts projects/web-mev/src/environments/environment.ts
    /usr/bin/npm run build
fi

/usr/bin/cp -a dist/web-mev/* /var/www/html
