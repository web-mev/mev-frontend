import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { ScatterPlotComponent } from './components/scatter-plot/scatter-plot.component';
import { SharedModule } from '@app/shared/shared.module';
import { AddSampleSetComponent } from './components/dialogs/add-sample-set/add-sample-set.component';
import { Deseq2Component } from './components/deseq2/deseq2.component';

@NgModule({
  declarations: [
    BarChartComponent,
    ScatterPlotComponent,
    AddSampleSetComponent,
    Deseq2Component
  ],
  imports: [CommonModule, SharedModule],
  exports: [ScatterPlotComponent, Deseq2Component]
})
export class D3Module {}
