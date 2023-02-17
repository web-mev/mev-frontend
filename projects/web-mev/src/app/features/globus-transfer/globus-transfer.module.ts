import { NgModule } from '@angular/core';

import { SharedModule } from '@app/shared/shared.module';
import { RouterModule } from '@angular/router';

import { GlobusUploadComponent } from './components/globus-upload/globus-upload.component';
import { GlobusDownloadComponent } from './components/globus-download/globus-download.component';
import { GlobusAuthComponent } from './components/globus-auth/globus-auth.component';
import { GlobusUploadRedirectComponent } from './components/globus-upload-redirect/globus-upload-redirect.component';
import { GlobusDownloadRedirectComponent } from './components/globus-download-redirect/globus-download-redirect.component';
import { GlobusRoutingModule } from './globus-transfer-routing.module';

@NgModule({
    declarations: [
        GlobusUploadComponent,
        GlobusDownloadComponent,
        GlobusAuthComponent,
        GlobusUploadRedirectComponent,
        GlobusDownloadRedirectComponent
    ],
    imports: [SharedModule, RouterModule, GlobusRoutingModule],
    exports: [
        GlobusAuthComponent,
        GlobusUploadComponent,
        GlobusDownloadComponent
    ]
})
export class GlobusModule { }
