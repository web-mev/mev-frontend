import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { AnnotationComponent } from './components/annotations/annotation-menu/annotations.component';
import { ContinuousDistributionDisplayComponent} from './components/annotations/continuous-distribution-display/continuous-distribution-display.component';
import { FactorDisplayComponent } from './components/annotations/factor-display/factor-display.component';

import { PreviewDialogComponent } from './components/dialogs/preview-dialog/preview-dialog.component';
import { MetadataComponent } from './components/metadata/metadata.component';
import { RouterModule } from '@angular/router';
import { AddAnnotationDialogComponent } from './components/metadata/dialogs/add-annotation-dialog/add-annotation-dialog.component';
import { AddObservationSetDialogComponent } from './components/metadata/dialogs/add-observation-set-dialog/add-observation-set-dialog.component';
import { AddFeatureSetDialogComponent } from './components/metadata/dialogs/add-feature-set-dialog/add-feature-set-dialog.component';
import { DeleteSetDialogComponent } from './components/metadata/dialogs/delete-set-dialog/delete-set-dialog.component';
import { ViewSetDialogComponent } from './components/metadata/dialogs/view-set-dialog/view-set-dialog.component';
import { SatPopoverModule } from '@ncstate/sat-popover';
import { AnalysisModule } from '../analysis/analysis.module';
import { EditSetDialogComponent } from './components/metadata/dialogs/edit-set-dialog/edit-set-dialog.component';
import { EditDialogComponent } from './components/dialogs/edit-dialog/edit-dialog/edit-dialog.component';
import { ViewInfoDialogComponent } from './components/metadata/dialogs/view-info-dialog/view-info-dialog.component';
import { SetDifferenceDialogComponent } from './components/metadata/dialogs/set-difference-dialog/set-difference-dialog.component';
import { DragDropModule } from '@angular/cdk/drag-drop';

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
    AddFeatureSetDialogComponent,
    DeleteSetDialogComponent,
    ViewSetDialogComponent,
    EditSetDialogComponent,
    EditDialogComponent,
    ViewInfoDialogComponent,
    SetDifferenceDialogComponent,
    AnnotationComponent,
    ContinuousDistributionDisplayComponent,
    FactorDisplayComponent
  ],
  exports: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    SatPopoverModule,
    RouterModule,
    AngularMultiSelectModule,
    AnalysisModule,
    WorkspaceDetailRoutingModule,
    DragDropModule
  ]
})
export class WorkspaceDetailModule {}
