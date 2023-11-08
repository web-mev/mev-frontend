import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { environment } from '@environments/environment';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { FileService } from '@app/features/file-manager/services/file-manager.service';
import { NotificationService } from '@core/notifications/notification.service';
import { map, tap, filter } from 'rxjs/operators';

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
  constructor(
    private analysesService: AnalysesService,
    private fileService: FileService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.updateOps();
  }

  updateOps(){
    this.analysesService.getAllNonWorkspaceExecOperations()
    .subscribe(
      (op_list:any) => {
        let ongoing_ops = false;
        for(var i in op_list){
          let x = op_list[i];
          if(x.execution_stop_datetime === null){
            // if the stop time was null, then the operation is still
            // processing (or there was a bug...)
            ongoing_ops = true;
            let op_uuid = x.id;
            this.analysesService.getExecutedOperationResult(op_uuid).subscribe(
              (response: any) => {
                // In case any of the operations were concerning file transfers
                // then initiate the polling file service. This way the file
                // listing will be updated without the user having to click
                // refresh.
                this.fileService.getAllFilesPolled();
              }
            );
          }
        }
        if(ongoing_ops){
          let message = 'Note: there are ongoing operations such as file transfers. The page should update automatically, but you may also manually refresh.'
          this.notificationService.info(message, 10000);
        }
      }
    );
  }

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
