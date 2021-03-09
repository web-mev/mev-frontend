import { 
  Component, 
  ChangeDetectionStrategy,
} from '@angular/core';
import { MevBaseExpressionPlotFormComponent } from '../base-expression-plot-form/base-expression-plot-form.component';

/*
* Component for presenting the form which creates a boxplot.
* The actual code to create the boxplot is in box-plotting.component.ts/html
*/
@Component({
  selector: 'mev-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class BoxplotFormComponent extends MevBaseExpressionPlotFormComponent {

  ngOnInit() {
    super.ngOnInit();
  }

}
