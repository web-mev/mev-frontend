import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

import { WorkspaceManagerRoutingModule } from './workspace-manager-routing.module';
import { WorkspaceListComponent } from './components/workspace-list/workspace-list.component';
import { AddDialogComponent } from './components/dialogs/add-dialog/add-dialog.component';
import { DeleteDialogComponent } from './components/dialogs/delete-dialog/delete-dialog.component';
import { EditDialogComponent } from './components/dialogs/edit-dialog/edit-dialog.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    WorkspaceListComponent,
    AddDialogComponent,
    DeleteDialogComponent,
    EditDialogComponent
  ],
  exports: [WorkspaceListComponent],
  imports: [CommonModule, WorkspaceManagerRoutingModule, SharedModule]
})
export class WorkspaceManagerModule {}
