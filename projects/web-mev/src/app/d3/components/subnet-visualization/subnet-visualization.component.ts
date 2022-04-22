import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MevBaseExpressionPlotFormComponent } from '../base-expression-plot-form/base-expression-plot-form.component';


@Component({
  selector: 'mev-subnet-visualization',
  templateUrl: './subnet-visualization.component.html',
  styleUrls: ['./subnet-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class SubnetVisualizationFormComponent extends MevBaseExpressionPlotFormComponent {

  ngOnInit() {
    super.ngOnInit();
  }
}
