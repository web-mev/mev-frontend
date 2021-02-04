import {
  Component,
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
export class AnalysisResultComponent implements OnChanges {
  @Input() outputs;
  operationName: string;
  constructor() {}

  ngOnChanges(): void {
    this.outputs = { ...this.outputs };
    this.operationName = this.getOperationName();
  }

  getOperationName() {
    if (typeof this.outputs.operation === 'string') {
      return this.outputs.operation;
    }
    return this.outputs.operation?.operation_name;
  }
}
