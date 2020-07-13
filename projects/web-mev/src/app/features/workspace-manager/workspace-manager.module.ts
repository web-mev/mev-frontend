import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkspaceManagerRoutingModule } from './workspace-manager-routing.module';
import { WorkspaceListComponent } from './components/workspace-list/workspace-list.component';
import { AddWSDialogComponent } from './components/dialogs/add-ws-dialog/add-ws-dialog.component';
import { DeleteWSDialogComponent } from './components/dialogs/delete-ws-dialog/delete-ws-dialog.component';
import { EditWSDialogComponent } from './components/dialogs/edit-ws-dialog/edit-ws-dialog.component';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  declarations: [
    WorkspaceListComponent,
    AddWSDialogComponent,
    DeleteWSDialogComponent,
    EditWSDialogComponent
  ],
  exports: [WorkspaceListComponent],
  imports: [CommonModule, WorkspaceManagerRoutingModule, SharedModule]
})
export class WorkspaceManagerModule {}
