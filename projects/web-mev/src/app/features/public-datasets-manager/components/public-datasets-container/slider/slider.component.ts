import { Options, ChangeContext } from '@angular-slider/ngx-slider';
import { Component, ChangeDetectionStrategy, Input, OnInit, EventEmitter, Output } from '@angular/core';
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
  @Output() childEvent = new EventEmitter()

  minValue;
  maxValue;
  options: Options;

  ngOnInit(): void {
    this.minValue = this.sliderStorage[this.currentDataset][this.info.key]['low'];
    this.maxValue = this.sliderStorage[this.currentDataset][this.info.key]['high'];
    this.options = {
      floor: this.sliderStorage[this.currentDataset][this.info.key]['floor'],
      ceil: this.sliderStorage[this.currentDataset][this.info.key]['ceil'],
    };
  }

  onUserChange(changeContext: ChangeContext): void {
    let temp = {
      "dataset": this.currentDataset,
      "category": this.info.key,
      "low": this.minValue,
      "high": this.maxValue
    }
    this.childEvent.emit(temp)
  }
}
