import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges
} from '@angular/core';

/**
 * Analysis Result Component
 * Container component used for displaying the result of an executed operation
 */
@Component({
  selector: 'mev-analysis-result',
  templateUrl: './analysis-result.component.html',
  styleUrls: ['./analysis-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AnalysisResultComponent implements OnChanges {
  @Input() outputs;
  operationName: string;
  constructor() { }

  ngOnChanges(): void {
    this.outputs = { ...this.outputs };
    this.operationName = this.getOperationName();
    console.log("op name: ", this.operationName)
  }

  /**
   * get the name of an executed or executing operation
   * for running operations the name is returned in the operation field
   * for executed operations the name is in operation_name property
   */
  getOperationName() {
    if (typeof this.outputs.operation === 'string') {
      return this.outputs.operation;
    }
    return this.outputs.operation?.operation_name;
  }
}
