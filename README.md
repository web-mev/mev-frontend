# WebMEV

- [General information](#GeneralInformation)
- [Running locally](#vagrant)
- [Deployment](#Deployment)
- [Documentation](#Documentation)
- [Settings](#Settings)
- [Features and bugs ](#Features)
- [Modules and components info](#Modules)
- [How to add a new visualization component](#AddNewComponent)

## <a name="GeneralInformation">**General information**</a>

The front end Angular 12 application for the MEV web application.

Compodoc documentation: [click here](https://web-mev.github.io/mev-frontend/documentation/overview.html)

Respository: https://github.com/web-mev/mev-frontend

The application was initially based on a Angular Material Starter project:
https://github.com/tomastrajan/angular-ngrx-material-starter
However, certain dependencies from that project were not maintained and packages
were removed for ease.


## <a name="vagrant">Running locally using Vagrant</a>

1. Install [Git](https://git-scm.com/), [VirtualBox](https://www.virtualbox.org/), and [Vagrant](https://www.vagrantup.com/)
1. Clone the repository: `git clone https://github.com/web-mev/mev-frontend.git`
1. `cp vagrant/env.tmpl vagrant/env.txt` and fill the variables with appropriate values.
    1. The `MEV_GOOGLE_OAUTH_CLIENT_ID` can be left blank (emptry string) if you do not wish to use Google-based login in local development.
    1. The `MEV_SENTRY_DSN` can also be left blank (empty string) for local dev. Errors will not be sent to the Sentry service.
    1. The `MEV_DROPBOX_KEY` can also be left blank (empty string) if you are not using/testing Dropbox in your local development.   
3. Start and provision the VM with `vagrant up`
4. Open http://localhost:8001 in a web browser. Note that the application served on this port is already built and any development changes will not be reflected unless you build again.

For development:
1. SSH in with `vagrant ssh`
1. Change to the shared directory (shared between your host machine and VM): `cd /vagrant` (note: not `/home/vagrant`) 
1. To serve the app using Angular web server:
```sh
/vagrant/node_modules/@angular/cli/bin/ng serve --host 0.0.0.0 --disable-host-check
```
Note that Node will warn that the `--disable-host-check` is a security issue. Since we are working on localhost, this is a moot point. 

Also note that the files on your host machine will be located at `/vagrant` inside the VM.

If you are editing/saving files locally (on your host machine, NOT the VM), Node's "auto detect" feature may not detect any changes which would normally trigger a re-build process. If that is the case, you may try to add an additional flag (`--poll`) to your serve command, e.g.
```sh
/vagrant/node_modules/@angular/cli/bin/ng serve --host 0.0.0.0 --disable-host-check --poll 2000
```
where the argument value (e.g. `2000` above) is the polling period in milliseconds.

The application will be available on your host machine at http://localhost:4200

If you wish to use Google-based authentication on the development machine (instead of username/password authentication), you will need a proper host pointing to localhost, because Google’s OAuth requires redirect URLs that cannot be localhost. You can add an entry in the hosts file of your machine (e.g. `/etc/hosts`) to associate mydomain.com to 127.0.0.1 and use the following command:

```sh
/vagrant/node_modules/@angular/cli/bin/ng serve --host mydomain.com --disable-host-check --poll 2000
```

**Also:** Note that due to high I/O during the provisioning of the VM, we perform a mount (see `vagrant/provision.sh` for details). If you halt or other stop the VM and do not force re-provisioning, you may find that the `/vagrant/node_modules` directory is empty and your project will not serve/build/etc. In that case, run the mount command `/usr/bin/mount --bind /home/vagrant/node_modules /vagrant/node_modules` again (after you SSH into the VM). The `/vagrant/node_modules` directory should contain a lot of files and subdirectories.

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
