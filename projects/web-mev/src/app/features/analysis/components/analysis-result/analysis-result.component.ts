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
  @Input() data;
  pcaData;
  constructor() {}

  ngOnInit(): void {
    this.pcaData = { ...this.data };
  }

  ngOnChanges(): void {
    this.pcaData = { ...this.data };
  }
}
