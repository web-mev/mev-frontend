import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'mev-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteDialogComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
