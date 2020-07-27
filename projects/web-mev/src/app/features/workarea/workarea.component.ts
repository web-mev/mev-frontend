import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { environment } from '@environments/environment';

@Component({
  selector: 'mev-workarea',
  templateUrl: './workarea.component.html',
  styleUrls: ['./workarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkareaComponent implements OnInit {
  private readonly API_NAME = environment.appName;
  selectedTabIndex = 0; // the first tab is default
  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    const index =
      localStorage.getItem(`${this.API_NAME}selectedTab`) ||
      this.selectedTabIndex;
    this.selectedTabIndex = Number(index);
  }

  goToNextTab() {
    this.selectedTabIndex = 1; // update tab index
  }

  onTabChange(event: MatTabChangeEvent) {
    localStorage.setItem(`${this.API_NAME}selectedTab`, String(event.index));
  }
}
