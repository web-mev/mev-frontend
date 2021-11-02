import { 
  Component, 
  OnInit, 
  ChangeDetectionStrategy,
  ChangeDetectorRef, 
  Output, 
  EventEmitter } from '@angular/core';
import { PublicDatasetService } from '../../services/public-datasets.service';
import { PublicDataset } from '../../models/public-dataset';

@Component({
  selector: 'mev-public-datasets-list',
  templateUrl: './public-datasets-list.component.html',
  styleUrls: ['./public-datasets-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicDatasetsListComponent implements OnInit {

  publicDatasets: PublicDataset[];
  @Output() datasetSelectedEvent = new EventEmitter<string>();

  constructor(
    private cdRef: ChangeDetectorRef,
    public pdService: PublicDatasetService
  ) {}

  ngOnInit() {
    console.log('in list init...');
    this.loadData();
  }

  public loadData() {
    console.log('load...');
    this.pdService.getPublicDatasets().subscribe(
      data => {
        this.publicDatasets = data;
        this.cdRef.markForCheck();
      }
    );
  }

  chooseDataset(datasetTag: string) {
    console.log('emit' + datasetTag + ' in list component');
    this.datasetSelectedEvent.emit(datasetTag);
  }

}
