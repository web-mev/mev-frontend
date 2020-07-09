import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { LoginComponent } from '@features/login/login.component';
import { RegisterComponent } from '@features/register/register.component';
import { RequestPasswordResetComponent } from '@features/request-password-reset/request-password-reset.component';
import { TutorialComponent } from '@features/tutorial/tutorial.component';
import { AuthGuardService } from '@core/auth/auth-guard.service';
import { WorkareaComponent } from '@features/workarea/workarea.component';
import { WorkspaceDetailComponent } from '@features/workspace-detail/components/workspace-detail/workspace-detail.component';
import { ResponsePasswordResetComponent } from './features/response-password-reset/response-password-reset.component';

const routes: Routes = [
  {
    path: 'about',
    loadChildren: () =>
      import('./features/about/about.module').then(
        m => m.AboutModule
      ) /*,
    canActivate: [AuthGuardService]*/
  },
  {
    path: 'tutorial',
    component: TutorialComponent
  },
  {
    path: 'workarea',
    component: WorkareaComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'workspace/:workspaceId',
    component: WorkspaceDetailComponent
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.module').then(m => m.SettingsModule)
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'activate/:uid/:token',
    component: LoginComponent
  },
  {
    path: 'reset',
    component: RequestPasswordResetComponent
  },
  {
    path: 'reset-password/:uid/:token',
    component: ResponsePasswordResetComponent
  },
  {
    path: '',
    redirectTo: 'about',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'feature-list'
  }
];

@NgModule({
  // useHash supports github.io demo page, remove in your app
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      scrollPositionRestoration: 'enabled',
      preloadingStrategy: PreloadAllModules,
      enableTracing: true
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
