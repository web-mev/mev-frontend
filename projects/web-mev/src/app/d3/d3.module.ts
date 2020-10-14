import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { SharedModule } from '@app/shared/shared.module';
import { AddSampleSetComponent } from './components/dialogs/add-sample-set/add-sample-set.component';

@NgModule({
  declarations: [
    BarChartComponent,
    ScatterPlotComponent,
    AddSampleSetComponent
  ],
  imports: [CommonModule, SharedModule],
  exports: [BarChartComponent, ScatterPlotComponent]
})
export class D3Module {}
