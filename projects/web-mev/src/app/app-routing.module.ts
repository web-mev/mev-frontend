import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { LoginComponent } from '@app/features/login/login.component';
import { RegisterComponent } from '@app/features/register/register.component';
import { TutorialComponent } from '@app/features/tutorial/tutorial.component';
import { UploadComponent } from '@app/shared/upload/upload.component';
import { AuthGuardService } from '@core/auth/auth-guard.service';
import { WorkareaComponent } from '@app/features/workarea/workarea.component';

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
    component: WorkareaComponent
  },
  {
    path: 'upload',
    component: UploadComponent,
    canActivate: [AuthGuardService]
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
