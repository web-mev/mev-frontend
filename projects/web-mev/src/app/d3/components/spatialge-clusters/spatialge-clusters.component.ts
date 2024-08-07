import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component';
import { CustomSetType, CustomSet } from '@app/_models/metadata';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';

@Component({
    selector: 'mev-spatialge-clusters',
    templateUrl: './spatialge-clusters.component.html',
    styleUrls: ['./spatialge-clusters.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGEClustersComponent extends BaseSpatialgeComponent implements OnInit {
    selectedSamples = [];
    customObservationSets = [];

    ngOnInit(): void {
        this.geneSearch = 'Gnai3';
        this.geneSearchVal = 'Gnai3';
        this.xAxisValue = this.outputs['ypos_col']
        this.yAxisValue = this.outputs['xpos_col']
        this.analysisType = 'clusters';
        this.getDataClusters();
    }

    /**
       * Function that is triggered when the user clicks the "Create a custom sample" button
       */
    selectedClustersList: string[] = [];
    onCreateCustomSampleSet() {
        this.selectedSamples.length = 0;
        for(let key of this.selectedClustersList){
            this.selectedSamples = [...this.selectedSamples, ...this.clusterData[key]]
        }
        const samples = this.selectedSamples.map(elem => {
            const sample = { id: elem.sample };
            return sample;
        });

        const dialogRef = this.dialog.open(AddSampleSetComponent);

        dialogRef.afterClosed().subscribe(customSetData => {
            if (customSetData) {
                const observationSet: CustomSet = {
                    name: customSetData.name,
                    type: CustomSetType.ObservationSet,
                    color: customSetData.color,
                    elements: samples
                };

                if (this.metadataService.addCustomSet(observationSet)) {
                    this.customObservationSets = this.metadataService.getCustomObservationSets();
                }
            }
        });
    }
}