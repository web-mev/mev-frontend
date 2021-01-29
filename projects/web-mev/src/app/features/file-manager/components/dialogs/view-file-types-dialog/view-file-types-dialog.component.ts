import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'mev-view-file-types-dialog',
  templateUrl: './view-file-types-dialog.component.html',
  styleUrls: ['./view-file-types-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewFileTypesDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<ViewFileTypesDialogComponent>) {}

  ngOnInit(): void {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
