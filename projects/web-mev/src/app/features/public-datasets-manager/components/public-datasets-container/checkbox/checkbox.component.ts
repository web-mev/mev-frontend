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
  @Input() title;
  @Input() currentDataset;
  @Input() alt
  @Input() version
  @Input() displayDetails
  showDescription: boolean
  minimum = 5
  maximum = 200
  filterSize: number = this.minimum;
  objectLength;

  constructor(public pds: PublicDatasetsComponent) { }

  ngOnInit(): void {
    this.objectLength = Object.keys(this.info.value).length;
  }

  showMore() {
    this.showDescription = !this.showDescription;
    this.filterSize = this.showDescription === false ? this.minimum : this.maximum;
  }

  expandSection() {
    this.displayDetails = !this.displayDetails;
  }
}
