import { Component, Input } from '@angular/core';

@Component({
  selector: 'globus-upload',
  templateUrl: './globus-upload.component.html',
  styleUrls: ['./globus-upload.component.css']
})
export class GlobusUploadComponent {
  // orchestrates the initial authentication and redirect to
  // the Globus file browser
  uploadInit() {
    console.log('Init upload');
  }
}