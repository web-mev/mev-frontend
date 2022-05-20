import { Options } from '@angular-slider/ngx-slider';
import { Component, OnChanges, ChangeDetectionStrategy, SimpleChanges, Input, OnInit } from '@angular/core';
import { PublicDatasetsComponent } from '../public-datasets.component';


@Component({
  selector: 'mev-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderPDSComponent extends PublicDatasetsComponent implements OnInit {
  @Input() info;
  @Input() currentDataset;
  @Input() targetOptions;
  @Input() tcgaOptions;
  @Input() cat;

  options2: Options;

  

  ngOnInit(): void {
      this.options2 = {
        floor: this.sliderMinMax[this.currentDataset][this.cat]['min'],
        ceil: this.sliderMinMax[this.currentDataset][this.cat]['max']
      }

      
      console.log("info from slider: ", this.info)
  }
}
