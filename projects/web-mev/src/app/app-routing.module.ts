import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { LoginComponent } from '@app/features/user/login/login.component';
import { RegisterComponent } from '@app/features/user/register/register.component';
import { RequestPasswordResetComponent } from '@app/features/user/request-password-reset/request-password-reset.component';
import { TutorialComponent } from '@features/tutorial/tutorial.component';
import { AuthGuardService } from '@core/auth/auth-guard.service';
import { ResponsePasswordResetComponent } from './features/user/response-password-reset/response-password-reset.component';
import { PasswordChangeComponent } from './features/user/password-change/password-change.component';
import { AuthRedirectComponent } from './features/user/auth-redirect/auth-redirect.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'about',
    pathMatch: 'full'
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./features/about/about.module').then(m => m.AboutModule)
  },
  {
    path: 'tutorial',
    component: TutorialComponent
  },
  {
    path: 'workarea',
    loadChildren: () =>
      import('./features/workarea/workarea.module').then(
        m => m.WorkareaModule
      ),
    canActivate: [AuthGuardService]
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.module').then(m => m.SettingsModule)
  },

  {
    path: 'workspace/:workspaceId',
    loadChildren: () =>
      import('./features/workspace-detail/workspace-detail.module').then(
        m => m.WorkspaceDetailModule
      ),
    canActivate: [AuthGuardService]
  },
  {
    path: 'analyses',
    loadChildren: () =>
      import('./features/analysis/analysis.module').then(m => m.AnalysisModule),
    canActivate: [AuthGuardService]
  },
  {
    path: 'analyses/:workspaceId',
    loadChildren: () =>
      import('./features/analysis/analysis.module').then(m => m.AnalysisModule),
    canActivate: [AuthGuardService]
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
    path: 'change-password',
    component: PasswordChangeComponent
  },
  { 
    path: 'oauth2-redirect/:oauth2_provider',
    component: AuthRedirectComponent
  },
  {
    path: '**',
    redirectTo: 'about'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: false,
      scrollPositionRestoration: 'enabled',
      preloadingStrategy: PreloadAllModules,
      enableTracing: false
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
