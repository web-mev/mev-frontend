var ROUTES_INDEX = {"name":"<root>","kind":"module","className":"AppModule","children":[{"name":"routes","filename":"projects/web-mev/src/app/app-routing.module.ts","module":"AppRoutingModule","children":[{"path":"about","loadChildren":"./features/about/about.module#AboutModule","children":[{"kind":"module","children":[{"name":"routes","filename":"projects/web-mev/src/app/features/about/about-routing.module.ts","module":"AboutRoutingModule","children":[{"path":"","component":"AboutComponent","data":{"title":"mev.menu.about"}}],"kind":"module"}],"module":"AboutModule"}]},{"path":"tutorial","component":"TutorialComponent"},{"path":"workarea","component":"WorkareaComponent","canActivate":["AuthGuardService"]},{"path":"workspace/:workspaceId","component":"WorkspaceDetailComponent"},{"path":"settings","loadChildren":"./features/settings/settings.module#SettingsModule","children":[{"kind":"module","children":[{"name":"routes","filename":"projects/web-mev/src/app/features/settings/settings-routing.module.ts","module":"SettingsRoutingModule","children":[{"path":"","component":"SettingsContainerComponent","data":{"title":"mev.menu.settings"}}],"kind":"module"}],"module":"SettingsModule"}]},{"path":"login","component":"LoginComponent"},{"path":"register","component":"RegisterComponent"},{"path":"activate/:uid/:token","component":"LoginComponent"},{"path":"reset","component":"RequestPasswordResetComponent"},{"path":"reset-password/:uid/:token","component":"ResponsePasswordResetComponent"},{"path":"","redirectTo":"about","pathMatch":"full"},{"path":"**","redirectTo":"feature-list"}],"kind":"module"},{"name":"routes","filename":"projects/web-mev/src/app/features/file-manager/file-manager-routing.module.ts","module":"FileManagerRoutingModule","children":[],"kind":"module"},{"name":"routes","filename":"projects/web-mev/src/app/features/workspace-detail/workspace-detail-routing.module.ts","module":"WorkspaceDetailRoutingModule","children":[],"kind":"module"},{"name":"routes","filename":"projects/web-mev/src/app/features/workspace-manager/workspace-manager-routing.module.ts","module":"WorkspaceManagerRoutingModule","children":[],"kind":"module"}]}
