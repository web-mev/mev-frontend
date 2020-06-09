import { Injectable } from '@angular/core';
// import { FileManagerModule } from '@app/features/file-manager/file-manager.module';
import { FileManagerApiService } from '@app/features/file-manager/api/file-manager-api.service';

@Injectable({
  providedIn: 'root'
})
export class FileManagerService {
  // НУЖНО ЛИ ИМЕТЬ МАССИВ ЗДЕСЬ ?
  // files: File[] = [];

  constructor(private api: FileManagerApiService) {}

  getFileList() {
    return this.api.getFiles();
  }

  addFile() {}
}
