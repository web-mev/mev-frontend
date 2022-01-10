import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy
  
} from '@angular/core';
import { BehaviorSubject, Observable, merge } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/table';
import { MatPaginator } from '@angular/material/paginator';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { MatDialog } from '@angular/material/dialog';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { CustomSetType } from '@app/_models/metadata';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { WGCNAQcPlotComponent } from './wgcna_qc_plot.component';

export interface WGCNAModule {
  module_name: string;
  module_genes: string[];
  module_size: number;
}

const xData: number[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];
const yData = [-0.395209276564604,0.000181464794426609,0.319297262771095,0.601067168394457,0.7695023948817,0.876964416299025,0.88701899855348,0.906664050360751,0.902306458185746,0.905494944436844,0.897228524058429,0.863385570441117,0.339675408249748,0.342288977524127,0.345117515314592,0.908110276016868,0.910241957941012,0.914723879531402,0.913025842750759,0.897654002402207,0.900894108035066,0.905244339078664,0.908473377611907,0.939843040492537,0.938145815134975,0.921153063077473,0.926065094240271,0.958738511022182,0.96491898558337,0.967627246072219];
let xyData = [];
for (let i=0; i<xData.length; i++){
    xyData.push(
        {
            x: xData[i],
            y: yData[i]
        }
    );
}
const beta = 5;
const FINAL_DATA = {
  pts: xyData,
  beta: beta
}

/**
 * Used for WGCNA output where we have both gene modules
 * and a QC plot
 */
@Component({
  selector: 'mev-wgcna',
  templateUrl: './wgcna.component.html',
  styleUrls: ['./wgcna.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class WgcnaComponent implements OnInit {
  @Input() outputs;
  modulesResourceId;
  qcId;

  analysisName = 'WGCNA';

  constructor() {
    console.log('in main constructor');
  }

  ngOnInit() {
    console.log('init main component');
    this.modulesResourceId = this.outputs['module_results'];
    this.qcId = this.outputs['network_connectivity_thresholds'];
  }

}