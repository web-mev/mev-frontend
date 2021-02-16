# WebMEV

- [General information](#GeneralInformation)
- [Installation](#Installation)
- [Settings](#Settings)
- [Modules and components info](#Modules)
- [Features and bugs ](#Features)

## <a name="GeneralInformation">**General information**</a>

The front end Angular 9 application for the MEV web application.

Compodoc documentation: [click here](https://web-mev.github.io/mev-frontend/documentation/overview.html)

Respository: https://github.com/web-mev/mev-frontend

Sentry error tracking and monitoring: http://35.199.2.238:9000/organizations/sentry/issues/

The application is based on a Angular Material Starter project:
https://github.com/tomastrajan/angular-ngrx-material-starter

## <a name="Installation">**Installation**</a>

Install the dependencies:

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

## <a name="Settings">**Settings**</a>

- File _app.component.ts_
  Use the following properties to update the application settings:
  -- _logo_: to update the application logo image
  -- _languages_: to set the list of available languages
  -- _sessionTimeout_: to set user idle / session timeout
  -- _navigation_: to set top navigation bar

- File _themes/default-theme.scss_
  Here you can change the color theme, specifying primary, accent and warning colors that will be used on components

- File _sentry-error-handler.ts_
  Use this file to set a configuration to handle error tracking

- File _jwtConfig.ts_
  Use this file to update settings for JWT authentication: `whiteListedDomains`(domains that are allowed to receive the JWT) and `blackListedRoutes`(routes that are not allowed to receive the JWT token)

## <a name="Modules">**Modules and components info**</a>

The structure of the application includes a few main modules:

1.  File Manager Module
    Includes components for uploading and managing user files. Users can upload files from local computer, Dropbox, rename files, edit file types, delete files.
    To add: download files to local computer, download to Dropbox
2.  Workspace Manager Module
    Contains the WorkspaceList component for managing user's workspace and a set of modal dialogs to add/edit/delete a workspace
3.  Workspace Details Module
    It is used to display the content of a workspace. It contains the WorkspaceDetails component which is used to display list of files (resources) included in the selected workspace. Also contains components for managing workspace metadata (user's custom observation and feature sets saved in the local storage) and modal dialogs for create/edit/delete actions.
4.  Analysis Module
    It contains components used on the Analysis Flow, Tools, Analyses Result.
5.  D3 Module
    It contains components (D3-charts and tables) used for different types of analyses (HCL, PCA, DESeq2, etc)
6.  Shared Module
    Contains commonly used directives, pipes, validators, help functions, shared components

## <a name="Features">**Features and bugs**</a>

https://docs.google.com/spreadsheets/d/1hyKzuzDYb5nYS1AKZByssyCLNSQS-FxEqEdQ82IakQ8/edit#gid=0
