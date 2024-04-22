import {
    Component,
    ChangeDetectionStrategy,
    OnChanges,
  } from '@angular/core';

  
  /**
   * Used to display interactive inputs for a differential expression 
   * style analysis
   */
  @Component({
    selector: 'differential-expression-input',
    templateUrl: './differential-expression-input.component.html',
    styleUrls: ['./differential-expression-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
  })
  export class DifferentialExpressionInputComponent implements OnChanges {
  
    ngOnChanges(): void {
      console.log('in dge component')
    }
  }
  
