import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { AuthenticationService } from '@app/core/authentication/authentication.service';
import { TutorialService } from './tutorial-service';
import { NotificationService } from '@app/core/core.module';

/**
 * Tutorial Component
 *
 * Display youtube player with tutorials (the Tutorial page)
 */
@Component({
  selector: 'mev-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorialComponent implements OnInit {

  isLoggedIn: boolean = false;

  // An array of objects to populate a table that has data files
  // for tutorials
  TUTORIAL_FILES = [
    {
      name: 'Example count matrix',
      direct_url: 'https://storage.googleapis.com/mev-example-data/hbr_and_uhr_counts.tsv',
      bucket_path: 'gs://mev-example-data/hbr_and_uhr_counts.tsv',
      resource_type: 'RNASEQ_COUNT_MTX'
    },
    {
      name: 'Example annotations',
      direct_url: 'https://storage.googleapis.com/mev-example-data/hbr_and_uhr_annotations.csv',
      bucket_path: 'gs://mev-example-data/hbr_and_uhr_annotations.csv',
      resource_type: 'ANN'
    },
    {
      name: 'Example single-cell dataset (counts only)',
      direct_url: 'https://storage.googleapis.com/mev-example-data/sctk_1k.csv',
      bucket_path: 'gs://mev-example-data/sctk_1k.csv',
      resource_type: 'RNASEQ_COUNT_MTX'
    }
  ];
  displayedColumns: string[];
  dataSource = this.TUTORIAL_FILES;
  constructor(
    private authService: AuthenticationService,
    private tutorialService: TutorialService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    this.displayedColumns = ['name']; // always shown
    if (currentUser) {
      this.isLoggedIn = true;
      this.displayedColumns.push('add_button');
    }
  }

  addFile(bucketPath: string, resourceType: string){
    this.tutorialService.addTutorialFile(
      {
        bucket_path: bucketPath,
        resource_type: resourceType
      }
    ).subscribe(
      x=>{
        let name = x['name'];
        let msg = `The file ${name} has been added to your files.`;
        this.notificationService.success(msg);
      }
    )
  }
}
