import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { environment } from '@environments/environment';

/**
 * Workarea Component
 *
 * Container component. Used to display 2 tabs for File Manager and Workspace Manager
 */

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

  /**
   * Gets the default tab from local storage
   */

  ngAfterViewInit() {
    const index =
      localStorage.getItem(`${this.API_NAME}selectedTab`) ||
      this.selectedTabIndex;
    this.selectedTabIndex = Number(index);
  }

  /**
   * Method is triggered when the user clicks the Next button to show the next tab
   */

  goToNextTab() {
    this.selectedTabIndex = 1; // update tab index
  }

  /**
   * Method is triggered when the user switched between tab and saves the active tab to local storage
   */

  onTabChange(event: MatTabChangeEvent) {
    localStorage.setItem(`${this.API_NAME}selectedTab`, String(event.index));
  }
}
