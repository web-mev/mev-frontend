import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'mev-view-info-dialog',
  templateUrl: './view-info-dialog.component.html',
  styleUrls: ['./view-info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewInfoDialogComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<ViewInfoDialogComponent>) {}

  ngOnInit(): void {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
