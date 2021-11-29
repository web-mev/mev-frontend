import { Component } from '@angular/core';
import { SctkDoubletDetectionComponent } from '../sctk-doublet-detection/sctk-doublet-detection.component';

@Component({
  selector: 'mev-sctk-cxds',
  templateUrl: './sctk-cxds-doublet-detection.component.html',
  styleUrls: ['../sctk-doublet-detection/sctk-doublet-detection.component.scss']
})
export class SctkCxdsDoubletDetectionComponent extends SctkDoubletDetectionComponent {
  imageName = 'cxds';
  analysisName = 'SCTK Cxds Doublet Finder';
  resourceIdName = 'SctkCxds.doublet_ids';

  ngOnInit() {
    super.ngOnInit();
  }
  ngAfterViewInit() {
    super.ngAfterViewInit();
  }
  ngOnChanges() {
    super.ngOnChanges();
  }
}
