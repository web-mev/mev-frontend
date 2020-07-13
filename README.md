# WebMEV

The front end Angular 9 application for the MEV web application.
Documentation: [click here](https://web-mev.github.io/mev-frontend/documentation/overview.html)

- Install the dependencies:

```sh
npm install
```

- Run the local development server:

```sh
ng serve
```

(you can access the app at http://localhost:4200)

or

```sh
ng serve --port 8080 --host mydomain.com
```

(for development purposes we need a proper host pointing to localhost, because Google’s OAuth requires redirect URLs that can’t be localhost. So you can add an entry in the hosts file of your machine to associate mydomain.com to 127.0.0.1. The app will be run at http://mydomain.com:8080)

- Generate project documentation:

```sh
npm run generate-docs
```

- Mock a RESTful API back-end with json-server:

```sh
npm run server
```

The file ./projects/server/database.json can be used to define API endpoints
