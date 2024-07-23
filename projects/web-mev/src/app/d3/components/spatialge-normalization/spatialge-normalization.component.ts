import { Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
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
        this.analysisType = 'normalization'
        this.getAxisColumnNames()
    }

    
}