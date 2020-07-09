import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'mev-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDialogComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  onNoClick() {
    alert('no');
  }

  confirmAdd() {
    alert('confirm');
  }
}
