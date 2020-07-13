import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'mev-add-dialog',
  templateUrl: './add-dialog.component.html',
  styleUrls: ['./add-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDialogComponent implements OnInit {
  itemList = [];
  selectedItems = [];
  settings = {};

  constructor() {}

  formControl = new FormControl('', [Validators.required]);

  ngOnInit(): void {
    this.itemList = [
      { id: 1, itemName: 'File 1' },
      { id: 2, itemName: 'File 2' },
      { id: 3, itemName: 'File 3' },
      { id: 4, itemName: 'File 4' },
      { id: 5, itemName: 'File 5' },
      { id: 6, itemName: 'File 6' }
    ];

    this.selectedItems = [
      { id: 1, itemName: 'File 1' },
      { id: 2, itemName: 'File 3' }
    ];
    this.settings = {
      text: 'Select resources',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      classes: 'resource-dropdown'
    };
  }

  onNoClick() {
    alert('no');
  }

  submit() {
    // empty stuff
  }

  confirmAdd() {
    alert('confirm');
  }

  getErrorMessage() {
    return this.formControl.hasError('required')
      ? 'Required field'
      : this.formControl.hasError('email')
      ? 'Not a valid email'
      : '';
  }

  onItemSelect(item: any) {
    console.log(item);
    console.log(this.selectedItems);
  }
  OnItemDeSelect(item: any) {
    console.log(item);
    console.log(this.selectedItems);
  }
  onSelectAll(items: any) {
    console.log(items);
  }
  onDeSelectAll(items: any) {
    console.log(items);
  }
}
