import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
    Output,
    EventEmitter,
    Input
  } from '@angular/core';

import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
  
  /**
   * Used to display interactive inputs for a differential expression 
   * style analysis
   */
  @Component({
    selector: 'differential-expression-input',
    templateUrl: './differential-expression-input.component.html',
    styleUrls: ['./differential-expression-input.component.scss'],
    providers: [{provide: BaseOperationInput, useExisting: DifferentialExpressionInputComponent}],
    changeDetection: ChangeDetectionStrategy.Default
  })
  export class DifferentialExpressionInputComponent extends BaseOperationInput implements OnChanges{
  
    @Input() operationData: any;

    ngOnChanges(): void {
      console.log('in dge component');
      console.log(this.operationData);
    }

    getInputData(): any {
      console.log('in getInputData of DGE class')
      return {'dge_input_a': 'abc'};
  }


  }
  
