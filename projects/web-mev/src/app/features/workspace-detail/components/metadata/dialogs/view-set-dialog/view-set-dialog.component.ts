import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'mev-view-set-dialog',
  templateUrl: './view-set-dialog.component.html',
  styleUrls: ['./view-set-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewSetDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<ViewSetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
