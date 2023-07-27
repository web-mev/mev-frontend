import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { PublicDatasetService } from '../../services/public-datasets.service';
import { PublicDataset } from '../../models/public-dataset';
import { PublicDatasetsComponent } from '../public-datasets-container/public-datasets.component'

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
    public pdService: PublicDatasetService,
    public publicDS: PublicDatasetsComponent
  ) { }

  ngOnInit() {
    this.loadData();
  }

  public loadData() {
    this.pdService.getPublicDatasets().subscribe(
      data => {
        this.publicDatasets = data;
        let activeSets = this.publicDatasets.map(x => x.tag);
        this.publicDS.initializeFilterData(activeSets);
        this.cdRef.markForCheck();
        console.log("public datasets list: ", this.publicDatasets)
      }
    );
  }

  chooseDataset(datasetTag: string) {
    this.datasetSelectedEvent.emit(datasetTag);
  }

}
