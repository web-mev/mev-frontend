import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { WorkspaceDetailRoutingModule } from './workspace-detail-routing.module';
import { WorkspaceDetailComponent } from './components/workspace-detail/workspace-detail.component';
import { FilterPipe } from '@features/workspace-detail/pipes/search';
import { AddDialogComponent } from './components/dialogs/add-dialog/add-dialog.component';
import { DeleteDialogComponent } from './components/dialogs/delete-dialog/delete-dialog.component';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { AvailableresourcePipe } from './pipes/available-resource';
import { PreviewDialogComponent } from './components/dialogs/preview-dialog/preview-dialog.component';

@NgModule({
  declarations: [
    WorkspaceDetailComponent,
    FilterPipe,
    AvailableresourcePipe,
    AddDialogComponent,
    DeleteDialogComponent,
    PreviewDialogComponent
  ],
  exports: [WorkspaceDetailComponent],
  imports: [
    WorkspaceDetailRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    SharedModule,
    AngularMultiSelectModule
  ]
})
export class WorkspaceDetailModule {}
