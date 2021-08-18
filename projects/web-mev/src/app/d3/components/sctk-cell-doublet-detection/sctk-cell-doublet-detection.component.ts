import { Component } from '@angular/core';
import { SctkDoubletDetectionComponent } from '../sctk-doublet-detection/sctk-doublet-detection.component';

@Component({
  selector: 'mev-sctk-cell',
  templateUrl: './sctk-cell-doublet-detection.component.html',
  styleUrls: ['../sctk-doublet-detection/sctk-doublet-detection.component.scss']
})
export class SctkCellDoubletDetectionComponent extends SctkDoubletDetectionComponent {
  imageName = 'cell';
  analysisName = 'SCTK Doublet Cells';
  resourceIdName = 'SctkDoubletCells.doublet_ids';

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
