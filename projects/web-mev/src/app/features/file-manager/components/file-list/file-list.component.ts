import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { File } from '@app/features/file-manager/models/file';
import { FileManagerService } from '@app/features/file-manager/services/file-manager.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'mev-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileListComponent implements OnInit {
  public files$: Observable<File[]>;
  // ИЛИ ?
  // files: File[] = this.FileManagerService.files;

  constructor(private fileManagerService: FileManagerService) {}

  ngOnInit(): void {
    this.getFiles();
  }

  getFiles() {
    this.files$ = this.fileManagerService.getFileList();

    // this.fileManagerService.getFileList()
    //   .subscribe(
    //     data => {
    //       this.files = data;
    //     },
    //     error => {
    //       console.log(error);
    //     });
  }

  addFile(file: File) {
    this.fileManagerService.addFile();
    // вызываем функцию File-сервиса Добавить Файл, которая
    // в свою очередь сделает 2 вещи:
    // 1. вызовет api-метод api.createResource
    // 2. обновит состояние file-list.state.ts - что это?

    // класс с BehaviorSubject
  }
}
