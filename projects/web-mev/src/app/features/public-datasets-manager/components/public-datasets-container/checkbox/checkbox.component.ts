import { Component, OnChanges, ChangeDetectionStrategy, SimpleChanges, Input, OnInit } from '@angular/core';
import { PublicDatasetsComponent } from '../public-datasets.component';

@Component({
  selector: 'mev-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckBoxComponent implements OnChanges, OnInit {
  @Input() info;
  @Input() checked;
  @Input() title;
  @Input() currentDataset;
  @Input() alt
  showDescription: boolean = false;
  filterSize: number = 5;
  minimum = 5
  objectLength;
  
  constructor(public pds: PublicDatasetsComponent) { }

  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {
    this.objectLength = Object.keys(this.info.value).length;
    console.log("compare datasets: ", this.info, this.alt)
    
  }

  showMore(){
    this.showDescription = !this.showDescription;
    this.filterSize = this.showDescription === false ? 5 : 200;
  }
}
