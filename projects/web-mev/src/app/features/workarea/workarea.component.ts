import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'mev-workarea',
  templateUrl: './workarea.component.html',
  styleUrls: ['./workarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkareaComponent implements OnInit {
  selectedTabIndex = 0;  // the first tab is default
  constructor() {}

  ngOnInit(): void {}


  goToNextTab() {
    this.selectedTabIndex = 1; // update tab index
  }
}
