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
    this.loadData();
  }

  public loadData() {
    this.pdService.getPublicDatasets().subscribe(
      data => {
        this.publicDatasets = data;
        this.cdRef.markForCheck();
      }
    );
  }

  chooseDataset(datasetTag: string) {
    this.datasetSelectedEvent.emit(datasetTag);
  }

}
