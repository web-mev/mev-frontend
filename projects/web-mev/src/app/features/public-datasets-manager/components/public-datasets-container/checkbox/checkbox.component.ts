import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { PublicDatasetsComponent } from '../public-datasets.component';

@Component({
  selector: 'mev-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckBoxComponent implements OnInit {
  @Input() info;
  @Input() checked;
  @Input() currentDataset;
  @Input() alt
  @Input() version
  @Input() displayDetails
  @Input() showMoreStatus
  showDescription: boolean;
  minimum = 5
  maximum = 200
  filterSize: number = this.minimum
  objectLength;

  constructor(public pds: PublicDatasetsComponent) { }

  ngOnInit(): void {
    this.objectLength = Object.keys(this.info.value).length;

    if (this.showMoreStatus[this.currentDataset] !== undefined && this.showMoreStatus[this.currentDataset][this.info.key] !== undefined) {
      if (this.showMoreStatus[this.currentDataset][this.info.key] === true) {
        this.filterSize = this.maximum;
        this.showDescription = true;
      } else {
        this.filterSize = this.minimum;
        this.showDescription = false;
      }
    }
  }

  showMore() {
    this.showDescription = !this.showDescription;
    this.filterSize = this.showDescription === false ? this.minimum : this.maximum;
    if (!this.showMoreStatus[this.currentDataset]) {
      this.showMoreStatus[this.currentDataset] = {};
    }
    if (!this.showMoreStatus[this.currentDataset][this.info.key] === undefined) {
      this.showMoreStatus[this.currentDataset][this.info.key] = true;
    } else {
      this.showMoreStatus[this.currentDataset][this.info.key] = !this.showMoreStatus[this.currentDataset][this.info.key]
    }
  }

  expandSection() {
    this.displayDetails = !this.displayDetails;
  }
}
