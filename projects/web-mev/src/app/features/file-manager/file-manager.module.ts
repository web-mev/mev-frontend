import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FileManagerRoutingModule } from './file-manager-routing.module';
import { FileManagerComponent } from './components/file-manager/file-manager.component';
import { FileListComponent } from '@app/features/file-manager/components/file-list/file-list.component';
import { FileItemComponent } from '@app/features/file-manager/components/file-item/file-item.component';
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  declarations: [FileManagerComponent, FileListComponent, FileItemComponent],
  exports: [FileManagerComponent],
  imports: [CommonModule, FileManagerRoutingModule, SharedModule]
})
export class FileManagerModule {}
