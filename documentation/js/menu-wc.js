'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">web-mev documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AboutModule.html" data-type="entity-link">AboutModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AboutModule-73fa8d7e7ae96609915d82e175d2ae86"' : 'data-target="#xs-components-links-module-AboutModule-73fa8d7e7ae96609915d82e175d2ae86"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AboutModule-73fa8d7e7ae96609915d82e175d2ae86"' :
                                            'id="xs-components-links-module-AboutModule-73fa8d7e7ae96609915d82e175d2ae86"' }>
                                            <li class="link">
                                                <a href="components/AboutComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AboutComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AboutRoutingModule.html" data-type="entity-link">AboutRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-d5a9b267b478b34a7e219f5a65162984"' : 'data-target="#xs-components-links-module-AppModule-d5a9b267b478b34a7e219f5a65162984"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-d5a9b267b478b34a7e219f5a65162984"' :
                                            'id="xs-components-links-module-AppModule-d5a9b267b478b34a7e219f5a65162984"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoginComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">LoginComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PasswordChangeComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PasswordChangeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RegisterComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RegisterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RequestPasswordResetComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RequestPasswordResetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ResponsePasswordResetComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ResponsePasswordResetComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TutorialComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TutorialComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkareaComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">WorkareaComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link">AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/CoreModule.html" data-type="entity-link">CoreModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/FileManagerModule.html" data-type="entity-link">FileManagerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' : 'data-target="#xs-components-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' :
                                            'id="xs-components-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' }>
                                            <li class="link">
                                                <a href="components/AddFileDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AddFileDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DeleteFileDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DeleteFileDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditFileDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EditFileDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FileListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FileListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressSnackbarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ProgressSnackbarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' : 'data-target="#xs-pipes-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' :
                                            'id="xs-pipes-links-module-FileManagerModule-3ec6ae986709c19403b5347333470b73"' }>
                                            <li class="link">
                                                <a href="pipes/ByteNamePipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ByteNamePipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FileManagerRoutingModule.html" data-type="entity-link">FileManagerRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SettingsModule.html" data-type="entity-link">SettingsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SettingsModule-b17204253d15e5cc67b3c1d8f409c2eb"' : 'data-target="#xs-components-links-module-SettingsModule-b17204253d15e5cc67b3c1d8f409c2eb"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SettingsModule-b17204253d15e5cc67b3c1d8f409c2eb"' :
                                            'id="xs-components-links-module-SettingsModule-b17204253d15e5cc67b3c1d8f409c2eb"' }>
                                            <li class="link">
                                                <a href="components/SettingsContainerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">SettingsContainerComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SettingsRoutingModule.html" data-type="entity-link">SettingsRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SharedModule.html" data-type="entity-link">SharedModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' : 'data-target="#xs-directives-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' :
                                        'id="xs-directives-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' }>
                                        <li class="link">
                                            <a href="directives/RtlSupportDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">RtlSupportDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' : 'data-target="#xs-pipes-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' :
                                            'id="xs-pipes-links-module-SharedModule-03c5d18cd7a805340c416d462fa0b318"' }>
                                            <li class="link">
                                                <a href="pipes/ByteNamePipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ByteNamePipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/WorkspaceDetailModule.html" data-type="entity-link">WorkspaceDetailModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' : 'data-target="#xs-components-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' :
                                            'id="xs-components-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' }>
                                            <li class="link">
                                                <a href="components/AddDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AddDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DeleteDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DeleteDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceDetailComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">WorkspaceDetailComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' : 'data-target="#xs-pipes-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' :
                                            'id="xs-pipes-links-module-WorkspaceDetailModule-8fcd1cd5816da7168321b7443f46406c"' }>
                                            <li class="link">
                                                <a href="pipes/FilterPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FilterPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/WorkspaceDetailRoutingModule.html" data-type="entity-link">WorkspaceDetailRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/WorkspaceManagerModule.html" data-type="entity-link">WorkspaceManagerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-WorkspaceManagerModule-b5daf8b1390a3af34c061264aed556c9"' : 'data-target="#xs-components-links-module-WorkspaceManagerModule-b5daf8b1390a3af34c061264aed556c9"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-WorkspaceManagerModule-b5daf8b1390a3af34c061264aed556c9"' :
                                            'id="xs-components-links-module-WorkspaceManagerModule-b5daf8b1390a3af34c061264aed556c9"' }>
                                            <li class="link">
                                                <a href="components/AddWSDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AddWSDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DeleteWSDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DeleteWSDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditWSDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EditWSDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">WorkspaceListComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/WorkspaceManagerRoutingModule.html" data-type="entity-link">WorkspaceManagerRoutingModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#components-links"' :
                            'data-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AddFileDialogComponent.html" data-type="entity-link">AddFileDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DeleteFileDialogComponent.html" data-type="entity-link">DeleteFileDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EditFileDialogComponent.html" data-type="entity-link">EditFileDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FileListComponent.html" data-type="entity-link">FileListComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProgressSnackbarComponent.html" data-type="entity-link">ProgressSnackbarComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ExampleDataSource.html" data-type="entity-link">ExampleDataSource</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExampleDataSource-1.html" data-type="entity-link">ExampleDataSource</a>
                            </li>
                            <li class="link">
                                <a href="classes/File.html" data-type="entity-link">File</a>
                            </li>
                            <li class="link">
                                <a href="classes/Workspace.html" data-type="entity-link">Workspace</a>
                            </li>
                            <li class="link">
                                <a href="classes/WorkspaceResource.html" data-type="entity-link">WorkspaceResource</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AnimationsService.html" data-type="entity-link">AnimationsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthEffects.html" data-type="entity-link">AuthEffects</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthenticationService.html" data-type="entity-link">AuthenticationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CustomSerializer.html" data-type="entity-link">CustomSerializer</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileAdapter.html" data-type="entity-link">FileAdapter</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FileService.html" data-type="entity-link">FileService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GoogleAnalyticsEffects.html" data-type="entity-link">GoogleAnalyticsEffects</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocalStorageService.html" data-type="entity-link">LocalStorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService.html" data-type="entity-link">NotificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SettingsEffects.html" data-type="entity-link">SettingsEffects</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TitleService.html" data-type="entity-link">TitleService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link">UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkspaceAdapter.html" data-type="entity-link">WorkspaceAdapter</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkspaceDetailService.html" data-type="entity-link">WorkspaceDetailService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkspaceService.html" data-type="entity-link">WorkspaceService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interceptors-links"' :
                            'data-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/HttpErrorInterceptor.html" data-type="entity-link">HttpErrorInterceptor</a>
                            </li>
                            <li class="link">
                                <a href="interceptors/TokenInterceptor.html" data-type="entity-link">TokenInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#guards-links"' :
                            'data-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AuthGuardService.html" data-type="entity-link">AuthGuardService</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AppState.html" data-type="entity-link">AppState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthState.html" data-type="entity-link">AuthState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Dropbox.html" data-type="entity-link">Dropbox</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DropboxChooseOptions.html" data-type="entity-link">DropboxChooseOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DropboxFile.html" data-type="entity-link">DropboxFile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RouterStateUrl.html" data-type="entity-link">RouterStateUrl</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SettingsState.html" data-type="entity-link">SettingsState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/State.html" data-type="entity-link">State</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link">User</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#pipes-links"' :
                                'data-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/FilterPipe.html" data-type="entity-link">FilterPipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});