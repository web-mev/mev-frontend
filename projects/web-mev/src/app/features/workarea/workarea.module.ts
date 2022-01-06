import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { RouterModule } from '@angular/router';
import { WorkareaRoutingModule } from './workarea-routing.module';
import { WorkareaComponent } from './components/workarea.component';
import { FileManagerModule } from '@app/features/file-manager/file-manager.module'
import { WorkspaceManagerModule} from '@app/features/workspace-manager/workspace-manager.module'
import { PublicDatasetsManagerModule} from '@app/features/public-datasets-manager/public-datasets-manager.module'
@NgModule({
  declarations: [
    WorkareaComponent,
  ],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule,
    WorkareaRoutingModule,
    FileManagerModule,
    WorkspaceManagerModule,
    PublicDatasetsManagerModule
  ]
})
export class WorkareaModule {}
