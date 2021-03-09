import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MevBaseExpressionPlotFormComponent } from '../base-expression-plot-form/base-expression-plot-form.component';


@Component({
  selector: 'mev-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HeatmapFormComponent extends MevBaseExpressionPlotFormComponent {

  ngOnInit() {
    super.ngOnInit();
  }
}
