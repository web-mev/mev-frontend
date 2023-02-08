import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GlobusAuthComponent } from './components/globus-auth/globus-auth.component';

const routes: Routes = [
  {
    path: 'auth-redirect',
    component: GlobusAuthComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GlobusRoutingModule {}
