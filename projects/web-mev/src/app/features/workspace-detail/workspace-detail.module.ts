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
import { AnnotationFilesPipe } from './pipes/annotation-files';

import { PreviewDialogComponent } from './components/dialogs/preview-dialog/preview-dialog.component';
import { MetadataComponent } from './components/metadata/metadata.component';
import { RouterModule } from '@angular/router';
import { AddAnnotationDialogComponent } from './components/metadata/dialogs/add-annotation-dialog/add-annotation-dialog.component';
import { AddObservationSetDialogComponent } from './components/metadata/dialogs/add-observation-set-dialog/add-observation-set-dialog.component';
import { DeleteSetDialogComponent } from './components/metadata/dialogs/delete-set-dialog/delete-set-dialog.component';
import { ViewSetDialogComponent } from './components/metadata/dialogs/view-set-dialog/view-set-dialog.component';
import { SatPopoverModule } from '@ncstate/sat-popover';
import { AnalysisModule } from '../analysis/analysis.module';
import { EditFeatureSetDialogComponent } from './components/metadata/dialogs/edit-feature-set-dialog/edit-feature-set-dialog.component';
import { EditDialogComponent } from './components/dialogs/edit-dialog/edit-dialog/edit-dialog.component';
import { ViewInfoDialogComponent } from './components/metadata/dialogs/view-info-dialog/view-info-dialog.component';

@NgModule({
  declarations: [
    WorkspaceDetailComponent,
    FilterPipe,
    ValidFilesPipe,
    AnnotationFilesPipe,
    AddDialogComponent,
    DeleteDialogComponent,
    PreviewDialogComponent,
    MetadataComponent,
    AddAnnotationDialogComponent,
    AddObservationSetDialogComponent,
    DeleteSetDialogComponent,
    ViewSetDialogComponent,
    EditFeatureSetDialogComponent,
    EditDialogComponent,
    ViewInfoDialogComponent
  ],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    SatPopoverModule,
    RouterModule,
    AngularMultiSelectModule,
    AnalysisModule,
    WorkspaceDetailRoutingModule
  ]
})
export class WorkspaceDetailModule {}
