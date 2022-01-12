import {
    Component,
    OnInit
  } from '@angular/core';
  import { MatDialogRef } from '@angular/material/dialog';
  
  /**
   *  
   * Modal dialog component which is used to show an example QC plot
   * to show an example of an "elbow"
   */
  @Component({
    selector: 'wgcna-elbow',
    templateUrl: './wgcna_elbow_example.component.html',
    styleUrls: ['./wgcna_elbow_example.component.scss']
  })
  export class WgcnaElbowDialogComponent implements OnInit {
  
    constructor(
      public dialogRef: MatDialogRef<WgcnaElbowDialogComponent>
    ) {}
  
    ngOnInit(): void {
      console.log('init dialog');
    }
  
    /**
     * Function is triggered when user clicks the Cancel button
     *
     */
    onNoClick(): void {
      console.log('about to close');
      this.dialogRef.close();
    }
  }
  