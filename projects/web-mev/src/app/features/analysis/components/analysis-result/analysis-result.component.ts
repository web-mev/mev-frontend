import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  OnChanges
} from '@angular/core';

@Component({
  selector: 'mev-analysis-result',
  templateUrl: './analysis-result.component.html',
  styleUrls: ['./analysis-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AnalysisResultComponent implements OnInit, OnChanges {
  @Input() outputs;
  //pcaData;
  constructor() {}

  ngOnInit(): void {
    this.outputs = { ...this.outputs };
  }

  ngOnChanges(): void {
    this.outputs = { ...this.outputs };
  }
}
