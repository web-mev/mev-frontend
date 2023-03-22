import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

import { catchError } from 'rxjs/operators';

@Component({
    selector: 'mev-lioness',
    templateUrl: './lioness.component.html',
    styleUrls: ['./lioness.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class LionComponent implements OnInit {

    workspaceId;
    inputForm: FormGroup;

    @Input() outputs;
    formLoading: boolean = false;
    isLoading: boolean = false;
    lionessData = [];

    radioButtonList = [
        {
            name: "Transcription Factor"
        },
        {
            name: "Genes"
        },
    ];
    resourceType = "Transcription Factor";
    showAnnotations = false;
    annotationData = [];
    hasResourceChanged = false;
    submitted = false;
    featureCount = 100;

    constructor(
        private route: ActivatedRoute,
        private apiService: AnalysesService,
        private formBuilder: FormBuilder
    ) { }

    ann_files = [];
    annotation_resource_type = ['ANN'];

    ngOnInit(): void {
        this.inputForm = this.formBuilder.group({
            'axisOption': [''],
            'ann': [''],
          });

        this.formLoading = true;
        this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');

        //gets the annotation only files
        this.apiService
            .getAvailableResourcesByParam(
                this.annotation_resource_type,
                this.workspaceId
            )
            .subscribe(data => {
                console.log('ann request: ', data)
                this.ann_files = data;
                this.ann_files.push({
                    'id': '',
                    'name': '(None)'
                })
                this.formLoading = false;
            });
    }

    createPlot(){
        this.isLoading = true;
        this.hasResourceChanged = true;

        // get the "axis" (transcription factor or gene) from the form:
        let axisOption = this.inputForm.value['axisOption'];

        let uuid_gene = this.outputs['mevLioness.lioness_gene_ts_tsv'];
        let uuid_tf = this.outputs['mevLioness.lioness_tf_ts_tsv'];
        let uuid = axisOption === "Genes" ? uuid_gene : uuid_tf;

        const filters = {
            'mad_n': this.featureCount,
            'transform-name': 'heatmap-reduce'
        };
        this.apiService
            .getResourceTransformQuery(
                uuid,
                filters
            ).pipe(
                catchError(error => {
                    console.log("Error: ", error.message);
                    let message = `Error: ${error.error.error}`;
                    throw message
                }))
            .subscribe((data: any[]) => {
                this.isLoading = false;
                this.lionessData = data;
            });


        const resourceId_ann = this.inputForm.value['ann'];
        if (resourceId_ann !== "") {
            this.showAnnotations = true;
            this.apiService
                .getResourceContent(
                    resourceId_ann,
                )
                .subscribe(features => {
                    this.annotationData = features;
                    console.log(this.annotationData)
                });
        } else {
            this.showAnnotations = false;
            this.annotationData = [];
        }
    }

    onSubmit(){
        this.submitted = true;
    }
}