import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component'

interface ScatterData {
    xValue: number;
    yValue: number;
    totalCounts: number;
}

@Component({
    selector: 'mev-spatialge-clusters',
    templateUrl: './spatialge-clusters.component.html',
    styleUrls: ['./spatialge-clusters.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGEClustersComponent extends BaseSpatialgeComponent implements OnInit {


    ngOnInit(): void {
        console.log("got to the init from clusters")
        this.getDataClusters()
    }


}