# WebMEV

- [General information](#GeneralInformation)
- [Running locally](#Running)
- [Deployment](#Deployment)
- [Documentation](#Documentation)
- [Settings](#Settings)
- [Features and bugs ](#Features)
- [Modules and components info](#Modules)
- [How to add a new visualization component](#AddNewComponent)

## <a name="GeneralInformation">**General information**</a>

The front end Angular 9 application for the MEV web application.

Compodoc documentation: [click here](https://web-mev.github.io/mev-frontend/documentation/overview.html)

Respository: https://github.com/web-mev/mev-frontend

Sentry error tracking and monitoring: http://35.199.2.238:9000/organizations/sentry/issues/

The application is based on a Angular Material Starter project:
https://github.com/tomastrajan/angular-ngrx-material-starter

## <a name="Running">**Running locally**</a>

To run locally check that you have Node.js and Angular CLI installed.
Then download the source code and install the dependencies:

```sh

npm install

```

Use the following command to build, watch and run your application locally:

```sh

ng serve

```

After that you can access the app at http://localhost:4200

But for development purposes we need a proper host pointing to localhost, because Google’s OAuth requires redirect URLs that cannot be localhost. You can add an entry in the hosts file of your machine to associate mydomain.com to 127.0.0.1 and use the following command:

```sh

ng serve --port 8080 --host mydomain.com

```

and the application will be run at http://mydomain.com:8080.

## <a name="Deployment">**Deployment**</a>

Before deploying the project run it locally first. To build the application run

```sh

ng build

```

That creates a _dist_ folder in the application root directory with all the static files that are needed for the deployment.\
We have an Apache web server running on a virtual machine instance on Google Compute Engine. So to update files, copy the contents of the _dist_ directory to the Apache html (_/var/www/html/web-mev_) directory of the VM.

## <a name="Documentation">**Documentation**</a>

To generate project documentation:

```sh

npm run generate-docs

```

## <a name="GCP">GCP</a>

* To configure:
  1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and [Terraform](https://www.terraform.io/downloads.html)
  1. Add service account with Editor role for the project
  1. Add and download service account key
  1. `cd deployment/terraform`
  1. `terraform init`
  1. `cp terraform.tfvars.template terraform.tfvars`
  1. edit `terraform.tfvars` to assign required configuration values 

* To build mev-frontend infrastructure:
  ```shell
  terraform apply
  ```
  You can access the instance using the returned IP address

* To delete mev-frontend infrastructure:
  ```shell
  terraform destroy
  ```

## <a name="Settings">**Settings**</a>

- File _app.component.ts_\
  Use the following properties to update the application settings:\
  -- _logo_: to update the application logo image\
  -- _languages_: to set the list of available languages\
  -- _sessionTimeout_: to set user idle / session timeout\
  -- _navigation_: to set top navigation bar\

- File _environment.prod.ts_\
  It is environment config to set the apiUrl variable ('http://35.194.76.64/api')

- File _themes/default-theme.scss_\
  Here you can change the color theme, specifying primary, accent and warning colors that will be used on components

- File _sentry-error-handler.ts_\
  Use this file to set a configuration to handle error tracking

- File _jwtConfig.ts_\
  Use this file to update settings for JWT authentication: `whiteListedDomains`(domains that are allowed to receive the JWT) and `blackListedRoutes`(routes that are not allowed to receive the JWT token)

## <a name="Features">**Features and bugs**</a>

https://docs.google.com/spreadsheets/d/1hyKzuzDYb5nYS1AKZByssyCLNSQS-FxEqEdQ82IakQ8/edit#gid=0

## <a name="Modules">**Modules and components info**</a>

The structure of the application includes a few main modules:

1.  About Module\
    Includes the About component which is responsible for the main start webMev page
2.  File Manager Module\
    Includes components for uploading and managing user files. Users can upload files from local computer, Dropbox, rename files, edit file types, delete files.
    To add: download files to local computer, download to Dropbox
3.  Workspace Manager Module\
    Contains the WorkspaceList component for managing user's workspace and a set of modal dialogs to add/edit/delete a workspace
4.  Workspace Details Module\
    It is used to display the content of a workspace. It contains the WorkspaceDetails component which is used to display list of files (resources) included in the selected workspace. Also contains components for managing workspace metadata (user's custom observation and feature sets saved in the local storage) and modal dialogs for create/edit/delete actions.
5.  Analysis Module\
    It contains components used on the Analysis Flow, Tools, Analyses Result.
6.  D3 Module\
    It contains components (D3-charts and tables) used for different types of analyses (HCL, PCA, DESeq2, etc)
7.  Shared Module\
    Contains commonly used directives, pipes, validators, help functions, shared components

## <a name="AddNewComponent">**How to add a new visualization component**</a>

1.  Create a new component in the D3/components folder.
2.  Add the _outputs_ property with the @Input() decorator. This property allows the parent component _ExecutedOperation_ to share the result of an executed operation with a visualization component. The _outputs_ property contains the following fields:

- operation,
- job_name,
- outputs,
- inputs,
- error_messages,\
  and they can be used in the visualization component.

3. Add the new component to the _exports_ array in _d3.module.ts_ file.
4. Open the _AnalysisResult_ component template and add a _ng-container_ for the newly created visualization component. Specify _ngIf expression_ using a new operation name.
