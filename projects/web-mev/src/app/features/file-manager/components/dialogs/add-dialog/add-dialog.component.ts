import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import { FileService } from "@file-manager/services/file-manager.service";
import { FormControl, Validators } from '@angular/forms';
import { File } from "@file-manager/models/file";

@Component({
  selector: 'mev-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss']
})
export class AddDialogComponent {

  private formData: FormData = new FormData();

  constructor(
    public dialogRef: MatDialogRef<AddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileService: FileService
  ) {}

  formControl = new FormControl('', [
    Validators.required
    // Validators.email,
  ]);


  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : this.formControl.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  submit() {
    // empty stuff
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  setFile(event) {
    let files = event.target.files;
    console.log("************* setFile Inside. files:");
    console.log(files)
    if (!files) {
      return
    }

    // let path = `${environment.celoApiEndpoint}/api/patientFiles`
    // let data = {"patientData": {
    //     "uid": "",
    //     "firstName": "",
    //     "lastName": "",
    //     "gender": "Not Specified",
    //     "dateOfBirth": ""
    //   }}



    // for (let i = 0; i < files.length; i++) {
    //   this.formData.append(i.toString(), files[i], files[i].name);
    // }





    console.log("this.data is the following:");
    console.log(this.data);
    //this.formData.append("data", JSON.stringify(this.data));

    this.formData.append("upload_file", files[0], files[0].name);
    this.formData.append("resource_type", "ANN");

    console.log("final form data:");
    console.log(this.formData);
    // this.http.post(path, formData).subscribe(
    //   (r)=>{console.log('got r', r)}
    // )
  }

  public confirmAdd(): void {
    console.log('confirmAdd() INSIDE');
    console.log('this.formData = ');
    console.log(this.formData);
    this.fileService.addFile(this.formData);
    //this.fileService.addFile(this.data);
  }



}
