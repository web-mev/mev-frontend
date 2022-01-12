import {
  Component,
  Input,
  OnInit
} from '@angular/core';


/**
 * Used for WGCNA output where we have both gene modules
 * and a QC plot
 */
@Component({
  selector: 'mev-wgcna',
  templateUrl: './wgcna.component.html',
  styleUrls: ['./wgcna.component.scss'],
})
export class WgcnaComponent implements OnInit {
  @Input() outputs;
  modulesResourceId;
  qcId;
  currentTabIdx = 0;

  analysisName = 'WGCNA';

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(){
    this.modulesResourceId = this.outputs['module_results'];
    this.qcId = this.outputs['network_connectivity_thresholds'];
    this.currentTabIdx = 0;
  }

}