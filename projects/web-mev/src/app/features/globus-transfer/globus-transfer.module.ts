import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { RouterModule } from '@angular/router';

import { GlobusUploadComponent } from './components/globus-upload/globus-upload.component';
import { GlobusAuthComponent } from './components/globus-auth/globus-auth.component';
import { GlobusUploadRedirectComponent } from './components/globus-upload-redirect/globus-upload-redirect.component';
import { GlobusRoutingModule } from './globus-transfer-routing.module';

@NgModule({
  declarations: [
      GlobusUploadComponent, 
      GlobusAuthComponent,
    GlobusUploadRedirectComponent
],
  imports: [SharedModule, RouterModule, GlobusRoutingModule],
  exports: [
      GlobusAuthComponent,
      GlobusUploadComponent
  ]
})
export class GlobusModule {}
