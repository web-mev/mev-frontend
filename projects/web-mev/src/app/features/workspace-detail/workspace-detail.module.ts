import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { WorkspaceDetailRoutingModule } from './workspace-detail-routing.module';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';
import { FilterPipe } from '@features/workspace-detail/pipes/search';
import { AddDialogComponent } from './components/dialogs/add-dialog/add-dialog.component';
import { DeleteDialogComponent } from './components/dialogs/delete-dialog/delete-dialog.component';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { ValidFilesPipe } from './pipes/valid-files';
import { PreviewDialogComponent } from './components/dialogs/preview-dialog/preview-dialog.component';
import { MetadataComponent } from './components/metadata/metadata.component';
import { RouterModule } from '@angular/router';
import { AddAnnotationDialogComponent } from './components/metadata/dialogs/add-annotation-dialog/add-annotation-dialog.component';
import { AddObservationSetDialogComponent } from './components/metadata/dialogs/add-observation-set-dialog/add-observation-set-dialog.component';

@NgModule({
  declarations: [
    WorkspaceDetailComponent,
    FilterPipe,
    ValidFilesPipe,
    AddDialogComponent,
    DeleteDialogComponent,
    PreviewDialogComponent,
    MetadataComponent,
    AddAnnotationDialogComponent,
    AddObservationSetDialogComponent
  ],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule,
    AngularMultiSelectModule,
    WorkspaceDetailRoutingModule
  ]
})
export class WorkspaceDetailModule {}
