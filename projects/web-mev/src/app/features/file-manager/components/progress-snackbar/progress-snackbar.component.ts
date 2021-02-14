import { Component, OnInit } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { FileService } from '@file-manager/services/file-manager.service';

/**
 * View Progress Snackbar Component
 *
 * Used to display the progress of file uploads
 */
@Component({
  selector: 'mev-progress-snackbar',
  templateUrl: './progress-snackbar.component.html',
  styleUrls: ['./progress-snackbar.component.scss']
})
export class ProgressSnackbarComponent implements OnInit {
  uploadProgressStatus = '';

  constructor(
    public snackBarRef: MatSnackBarRef<ProgressSnackbarComponent>,
    public fileService: FileService
  ) {}

  ngOnInit(): void {
    this.fileService.fileUploadsProgress.subscribe(data => {
      let txt = '';
      for (const key of Object.keys(data)) {
        txt += `File ${key} is ${data[key].percent}% uploaded. <br>`;
      }
      this.uploadProgressStatus = txt;
    });
  }
}
