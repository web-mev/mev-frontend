import { Component, OnInit, Input, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'mev-input-info-dialog',
  templateUrl: './input-info-dialog.component.html',
  styleUrls: ['./input-info-dialog.component.scss']
})
export class InputInfoDialogComponent {
  @Input() outputs;

  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

}