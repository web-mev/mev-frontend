import { Options } from '@angular-slider/ngx-slider';
import { Component, OnChanges, ChangeDetectionStrategy, SimpleChanges, Input, OnInit } from '@angular/core';
import { PublicDatasetsComponent } from '../public-datasets.component';


@Component({
  selector: 'mev-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderPDSComponent extends PublicDatasetsComponent implements OnInit, OnChanges {
  @Input() info;
  @Input() currentDataset;
  @Input() cat;

  options: Options;
  // lowSelectedValue: number
  // highSelectedValue: number


  ngOnInit(): void {
    this.options = {
      floor: this.sliderMinMax[this.currentDataset][this.cat]['floor'],
      ceil: this.sliderMinMax[this.currentDataset][this.cat]['ceil']
    }
    console.log("count: ", this.info.value.count)
  }

  ngOnChanges(changes: SimpleChanges): void {
      console.log("changes from slider: ", this.sliderMinMax[this.currentDataset][this.cat]['low'], this.sliderMinMax[this.currentDataset][this.cat]['high'])
  }
}
