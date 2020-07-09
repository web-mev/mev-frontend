import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FileManagerRoutingModule } from './file-manager-routing.module';
import { FileListComponent } from '@app/features/file-manager/components/file-list/file-list.component';
import { AddDialogComponent } from '@file-manager/components/dialogs/add-dialog/add-dialog.component';
import { EditDialogComponent } from '@file-manager/components/dialogs/edit-dialog/edit-dialog.component';
import { DeleteDialogComponent } from '@file-manager/components/dialogs/delete-dialog/delete-dialog.component';
import { ProgressSnackbarComponent } from '@file-manager/components/progress-snackbar/progress-snackbar.component';

import { SharedModule } from '@app/shared/shared.module';
import { ByteNamePipe } from './pipes/byte-name.pipe';


@NgModule({
  declarations: [ 
    FileListComponent, 
    AddDialogComponent, 
    EditDialogComponent, 
    DeleteDialogComponent, 
    ByteNamePipe, 
    ProgressSnackbarComponent],
  exports: [
    FileListComponent
  ],
  imports: [CommonModule, FileManagerRoutingModule, SharedModule]
})
export class FileManagerModule { }
