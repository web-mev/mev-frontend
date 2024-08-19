import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component'

interface ScatterData {
    xValue: number;
    yValue: number;
    totalCounts: number;
}

@Component({
    selector: 'mev-spatialge-normalization',
    templateUrl: './spatialge-normalization.component.html',
    styleUrls: ['./spatialge-normalization.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGENormalizationComponent extends BaseSpatialgeComponent implements OnInit {

    ngOnInit(): void {
        this.geneSearch= 'Gnai3';
        this.geneSearchVal= 'Gnai3';
        this.xAxisValue = this.outputs['ypos_col'];
        this.yAxisValue = this.outputs['xpos_col'];
        this.analysisType = 'normalization';
        this.getDataNormalization();
    }


}