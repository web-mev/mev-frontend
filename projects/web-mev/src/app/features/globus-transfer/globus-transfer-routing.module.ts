import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GlobusAuthComponent } from './components/globus-auth/globus-auth.component';
import { GlobusUploadRedirectComponent } from './components/globus-upload-redirect/globus-upload-redirect.component';

const routes: Routes = [
  {
    path: 'auth-redirect',
    component: GlobusAuthComponent
  },
  {
    path: 'upload-redirect',
    component: GlobusUploadRedirectComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GlobusRoutingModule {}
