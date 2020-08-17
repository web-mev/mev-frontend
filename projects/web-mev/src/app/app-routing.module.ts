import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { LoginComponent } from '@app/features/user/login/login.component';
import { RegisterComponent } from '@app/features/user/register/register.component';
import { RequestPasswordResetComponent } from '@app/features/user/request-password-reset/request-password-reset.component';
import { TutorialComponent } from '@features/tutorial/tutorial.component';
import { AuthGuardService } from '@core/auth/auth-guard.service';
import { WorkareaComponent } from '@features/workarea/workarea.component';
import { WorkspaceDetailComponent } from '@features/workspace-detail/components/workspace-detail/workspace-detail.component';
import { ResponsePasswordResetComponent } from './features/user/response-password-reset/response-password-reset.component';
import { PasswordChangeComponent } from './features/user/password-change/password-change.component';
import { AnalysesComponent } from './features/analysis/components/analysis-list/analyses.component';

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
    path: 'analyses/:workspaceId',
    component: AnalysesComponent,
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
    path: 'change-password',
    component: PasswordChangeComponent
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
export class AppRoutingModule {}
