import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FileManagerRoutingModule } from './file-manager-routing.module';
import { FileListComponent } from '@app/features/file-manager/components/file-list/file-list.component';
import { AddFileDialogComponent } from '@app/features/file-manager/components/dialogs/add-file-dialog/add-file-dialog.component';
import { EditFileDialogComponent } from '@app/features/file-manager/components/dialogs/edit-file-dialog/edit-file-dialog.component';
import { DeleteFileDialogComponent } from '@app/features/file-manager/components/dialogs/delete-file-dialog/delete-file-dialog.component';
import { ProgressSnackbarComponent } from '@file-manager/components/progress-snackbar/progress-snackbar.component';
import { SetTypeFormatDialogComponent } from '@app/features/file-manager/components/dialogs/set-type-format-dialog/set-type-format-dialog.component';

import { SharedModule } from '@app/shared/shared.module';
import { ViewFileTypesDialogComponent } from './components/dialogs/view-file-types-dialog/view-file-types-dialog.component';
import { FileDownloadDirective } from './directives/file-download'
@NgModule({
  declarations: [
    FileListComponent,
    AddFileDialogComponent,
    EditFileDialogComponent,
    DeleteFileDialogComponent,
    ProgressSnackbarComponent,
    ViewFileTypesDialogComponent,
    FileDownloadDirective,
    SetTypeFormatDialogComponent 
  ],
  exports: [FileListComponent],
  imports: [CommonModule, FileManagerRoutingModule, SharedModule]
})
export class FileManagerModule {}
