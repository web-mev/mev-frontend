import { Component, ChangeDetectionStrategy, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Options, ChangeContext } from '@angular-slider/ngx-slider';
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
  @Input() countNum;
  @Input() title
  @Output() childEvent = new EventEmitter()
  @Input() category
  @Input() displayDetails
  @Output() checkEvent = new EventEmitter()

  minValue;
  maxValue;
  count;
  options: Options;

  ngOnInit(): void {
    this.minValue = this.sliderStorage[this.currentDataset][this.info.key]['low'];
    this.maxValue = this.sliderStorage[this.currentDataset][this.info.key]['high'];
    this.count = this.sliderStorage[this.currentDataset][this.info.key]['count']
    this.options = {
      floor: this.sliderStorage[this.currentDataset][this.info.key]['floor'],
      ceil: this.sliderStorage[this.currentDataset][this.info.key]['ceil'],
      showTicks: true,
      tickStep: (this.maxValue - this.minValue) / 8
    };
  }

  onUserChangeEnd(changeContext: ChangeContext): void {
    let temp = {
      "dataset": this.currentDataset,
      "category": this.info.key,
      "low": this.minValue,
      "high": this.maxValue
    }
    this.childEvent.emit(temp)
  }

  onCheckedNotReported(currResult, cat, dataset) {
    let temp = {
      "checked": currResult,
      "cat": cat,
      "dataset" : dataset
    }
    this.checkEvent.emit(temp)
  }


}
