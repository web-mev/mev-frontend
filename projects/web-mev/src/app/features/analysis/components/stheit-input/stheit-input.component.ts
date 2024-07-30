import { Component, ChangeDetectionStrategy, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControlOptions } from '@angular/forms';
import { AnalysesService } from '../../services/analysis.service';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { catchError } from "rxjs/operators";
import { forkJoin } from 'rxjs';
import { NotificationService } from '@core/notifications/notification.service';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

import { CustomSet, CustomSetType } from '@app/_models/metadata';

interface ScatterDataCluster {
    xValue: number;
    yValue: number;
    clusterid: string
}

@Component({
    selector: 'stheit-input',
    templateUrl: './stheit-input.component.html',
    styleUrls: ['./stheit-input.component.scss'],
    providers: [{ provide: BaseOperationInput, useExisting: StheitInputComponent }],
    changeDetection: ChangeDetectionStrategy.Default
})

export class StheitInputComponent extends BaseOperationInput implements OnChanges {
    analysesForm: FormGroup;
    submitted = false;

    @Input() operationData: any;
    @Input() workspaceId: string;
    @Output() formValid: EventEmitter<any> = new EventEmitter<any>();
    private readonly API_URL = environment.apiUrl;

    // reference_cluster_selection: string = 'obs_set';
    availableObsSets;
    availableFeatureSets;
    sampleNameField;
    obsSetField;
    stClustResultsField;
    rawCountsField;
    coordMetadataField;
    normalizationMethodField;
    normalizationMethodField2;
    distanceSummaryField;
    numGenesField;
    statMethodField;
    featuresField;
    xPosField;
    yPosField
    clustering_job_id = '';

    stclust_retrieved = false;
    files_retrieved = false;
    stclust_results = [];
    raw_count_files = [];
    ann_files = [];

    outputs_file_uuid;
    input_counts_uuid = '';
    input_metadata_uuid = '';
    normalization_method = '';

    curr_coords_metadata_uuid = ''


    selectedObsClusterField = {};

    // scatterPlotDataCluster: ScatterDataCluster[] = [];

    // dataDict: Record<string, any> = {}

    // xMin: number = 100000000
    // xMax: number = 0
    // yMin: number = 100000000
    // yMax: number = 0
    // totalCountsMax: number = 0;
    // totalCountsMin: number = 100000000;

    // totalCounts: Record<string, any> = {}

    // plotWidth: number = 300;
    // plotHeight: number = 500;
    // originalPlotWidth: number = 0;
    // originalPlotHeight: number = 0;
    // legendWidth: number = 120;

    // clusterTypes: Record<string, any> = {};
    // clusterColors: string[] = ["#EBCD00", "#52A52E", "#00979D", "#6578B4", "#80408D", "#C9006B", "#68666F", "#E80538", "#E87D1E"];

    // normalizePlotWidth = 300;
    // imageOverlayOffset = 220;

    observationSetsClusters = {}

    constructor(
        private apiService: AnalysesService,
        private formBuilder: FormBuilder,
        private httpClient: HttpClient,
        private metadataService: MetadataService,
        protected readonly notificationService: NotificationService,
    ) {
        super();

        // get and 'cache' the available observation sets
        this.availableObsSets = this.metadataService.getCustomObservationSets().map(set => {
            const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
            });
            return { ...set, elements: newSet };
        });

        this.availableFeatureSets = this.metadataService.getCustomFeatureSets().map(set => {
            const newSet = set.elements.map(elem => {
                const o = { id: elem.id };
                return o;
            });
            return { ...set, elements: newSet };
        });
        console.log("avail fs: ", this.availableFeatureSets)
    }

    ngOnChanges(): void {
        if (this.operationData) {
            console.log("operation data from stheit:  ", this.operationData)
            this.createForm();
            this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
        }
        if (this.workspaceId && !this.stclust_retrieved) {
            this.queryForSTclustResults();
        }
        if (this.workspaceId && this.operationData && !this.files_retrieved) {
            this.getPotentialInputFiles();
        }
    }

    public onFormValid() {
        this.formValid.emit(this.analysesForm.valid);
    }

    onSelectionChangeCoordMetadata(file) {
        this.curr_coords_metadata_uuid = file.value
        this.getAxisColumnNames()
    }

    getAxisColumnNames() {
        this.isLoading = true;
        this.httpClient.get(`${this.API_URL}/resources/${this.curr_coords_metadata_uuid}/contents/?page=1&page_size=1`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: ${error.error.error}`);
                throw error;
            })
        ).subscribe(res => {
            this.isLoading = false;
            let jsonObj = res['results'][0]['values']
            const keys = Object.keys(jsonObj);
            this.xAxisValueList = keys;
            this.yAxisValueList = keys;
        })
    }

    createForm() {
        let key;
        let input;
        const controlsConfig = {};
        controlsConfig['job_name'] = ['', [Validators.required]];
        // controlsConfig['reference_cluster_selection'] = [this.reference_cluster_selection, []];

        key = 'sample_name'
        input = this.operationData.inputs[key];
        this.sampleNameField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required
        };

        const configSampleNameField = [
            '',
            [...(input.required ? [Validators.required] : [])]
        ];
        controlsConfig[key] = configSampleNameField;

        // key = 'barcodes';
        // input = this.operationData.inputs[key];
        // this.obsSetField = {
        //     key: key,
        //     name: input.name,
        //     desc: input.description,
        //     required: input.required,
        //     sets: this.availableObsSets
        // };
        // const configObsSetsField = [
        //     undefined,
        //     [...(input.required ? [Validators.required] : [])]
        // ];
        // controlsConfig[key] = configObsSetsField;

        key = "raw_counts"
        input = this.operationData.inputs[key];
        this.rawCountsField = {
            key: key,
            name: input.name,
            resource_types: input.spec.resource_types,
            desc: input.description,
            required: input.required,
            files: this.raw_count_files,
            selectedFiles: []
        };

        const configRawCountsField = [
            '',
            []
        ];
        controlsConfig[key] = configRawCountsField;

        key = "coords_metadata"
        input = this.operationData.inputs[key];
        this.coordMetadataField = {
            key: key,
            name: input.name,
            resource_types: input.spec.resource_types,
            desc: input.description,
            required: input.required,
            files: this.ann_files,
            selectedFiles: []
        };

        const configCoordMetaField = [
            '',
            []
        ];
        controlsConfig[key] = configCoordMetaField;

        key = 'normalization_method';
        input = this.operationData.inputs[key];
        this.normalizationMethodField = {
            key: key,
            name: input.name,
            desc: input.description,
            options: input.spec.options
        };
        const configNormalizationMethodChoiceField = [
            '',
            [Validators.required, Validators.minLength(1)]
        ];
        controlsConfig[key] = configNormalizationMethodChoiceField;

        key = 'stat_method';
        input = this.operationData.inputs[key];
        this.statMethodField = {
            key: key,
            name: input.name,
            desc: input.description,
            options: input.spec.options
        };
        const configStatMethodField = [
            '',
            [Validators.required, Validators.minLength(1)]
        ];
        controlsConfig[key] = configStatMethodField;

        key = 'features'
        input = this.operationData.inputs[key];
        this.featuresField = {
            key: key,
            name: input.name,
            desc: input.description,
            required: input.required,
            files: this.availableFeatureSets
        };
        const configFeatureSetsField = [
            undefined,
            [...(input.required ? [Validators.required] : [])]
        ];

        // const configFeatureSetsField = [
        //     '',
        //     []
        // ];
        controlsConfig[key] = configFeatureSetsField;

        key = 'xpos_col';
        input = this.operationData.inputs[key];
        this.xPosField = {
            key: key,
            name: input.name,
            desc: input.description,
            options: input.spec.options,
            files: this.availableFeatureSets
        };
        const configXPosField = [
            '',
            [Validators.required, Validators.minLength(1)]
        ];
        controlsConfig[key] = configXPosField;

        key = 'ypos_col';
        input = this.operationData.inputs[key];
        this.yPosField = {
            key: key,
            name: input.name,
            desc: input.description,
            files: this.availableFeatureSets
        };
        const configYPosField = [
            '',
            [Validators.required, Validators.minLength(1)]
        ];
        controlsConfig[key] = configYPosField;

        this.analysesForm = this.formBuilder.group(controlsConfig,
            {
                validators: [],
                asyncValidators: [],
                updateOn: 'change'
            } as AbstractControlOptions);
    }

    getInputData(): any {
        return this.analysesForm.value;
    }

    /**
     * Convenience getter for easy access to form fields
     */
    get f() {
        return this.analysesForm.controls;
    }

    onSubmit() {
        this.submitted = true;
    }

    /**
     * Triggered when the toggle is chosen to select between using an observation 
     * set and using prior STClust results.
     */
    clusterOptionChange() {
        // this.reference_cluster_selection = this.analysesForm.value.reference_cluster_selection;
        this.analysesForm = null
        this.createForm();
        this.analysesForm.statusChanges.subscribe(() => this.onFormValid());
    }

    /**
     * Grabs all successful STClust runs in the current workspace
     */
    queryForSTclustResults() {
        this.apiService
            .getExecOperations(
                this.workspaceId
            )
            .subscribe(data => {
                this.stclust_results = data.filter(
                    (exec_op) => (exec_op.operation.operation_name === 'spatialGE clustering')
                        && (!exec_op.job_failed)
                );
                this.stclust_retrieved = true;
            });
    }

    getPotentialInputFiles() {
        let raw_counts_input = this.operationData.inputs['raw_counts'];
        let coords_metadata_input = this.operationData.inputs['coords_metadata'];
        let all_resource_types = [...raw_counts_input.spec.resource_types, coords_metadata_input.spec.resource_type]
        this.apiService
            .getWorkspaceResourcesByParam(
                all_resource_types,
                this.workspaceId
            )
            .subscribe(data => {
                for (let file_data of data) {
                    if (raw_counts_input.spec.resource_types.includes(file_data.resource_type)) {
                        this.raw_count_files.push(file_data);
                    }
                    else if (file_data.resource_type === coords_metadata_input.spec.resource_type) {
                        this.ann_files.push(file_data)
                    }
                }
                this.files_retrieved = true;
                console.log("ann files: ", this.ann_files)
            });
    }

    // onClusterTypeSelection() {
    //     let val = this.analysesForm.value['stclust_results'];
    //     // TODO: use the UUID here to get the results for plotting.
    //     this.outputs_file_uuid = val.outputs.clustered_positions;
    //     this.input_counts_uuid = val.inputs.raw_counts;
    //     this.input_metadata_uuid = val.inputs.coords_metadata;
    //     this.normalization_method = val.inputs.normalization_method;
    //     this.clustering_job_id = val.id;

    //     this.analysesForm.value['coords_metadata'] = this.input_metadata_uuid
    //     this.analysesForm.value['normalization_method'] = this.normalization_method
    //     this.analysesForm.value['raw_counts'] = this.input_counts_uuid

    //     this.getAxisColumnNamesGradient();
    //     // this.resetAllVariables();
    // }

    isLoading = false;
    xAxisValue: string = '';
    yAxisValue: string = ''
    xAxisValueList: string[] = [];
    yAxisValueList: string[] = [];

    clusterList = [];
    clusterValue = '';

    // getAxisColumnNamesGradient() {
    //     this.isLoading = true;
    //     this.httpClient.get(`${this.API_URL}/resources/${this.input_metadata_uuid}/contents/?page=1&page_size=1`).pipe(
    //         catchError(error => {
    //             this.isLoading = false;
    //             this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
    //             console.log("some error from coord: ", error)
    //             throw error;
    //         })
    //     ).subscribe(res => {
    //         this.isLoading = false;
    //         let jsonObj = res['results'][0]['values']
    //         const keys = Object.keys(jsonObj);
    //         this.xAxisValueList = keys;
    //         this.yAxisValueList = keys;
    //     })
    // }



    scrollTo(htmlID) {
        const element = document.getElementById(htmlID) as HTMLElement;
        element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }

    // resetAllVariables() {
    //     this.scatterPlotDataCluster = [];
    //     this.xMin = 100000000
    //     this.xMax = 0
    //     this.yMin = 100000000
    //     this.yMax = 0
    //     this.totalCountsMax = 0;
    //     this.totalCountsMin = 100000000;

    //     this.dataDict = {}
    //     this.plotWidth = 300;
    //     this.plotHeight = 500;
    //     this.originalPlotWidth = 0;
    //     this.originalPlotHeight = 0;

    //     this.legendWidth = 120;

    // }

    // getDataClusters() {
    //     this.isLoading = true;
    //     this.scrollTo('topOfPage');
    //     let clusters_uuid = this.outputs_file_uuid
    //     let coords_metadata_uuid = this.input_metadata_uuid

    //     const clusterRequest = this.httpClient.get(`${this.API_URL}/resources/${clusters_uuid}/contents/`).pipe(
    //         catchError(error => {
    //             this.isLoading = false;
    //             this.notificationService.error(`Error ${error.status}: Error from normalized expression request.`);
    //             throw error;
    //         })
    //     );

    //     const coordsMetadataRequest = this.httpClient.get(`${this.API_URL}/resources/${coords_metadata_uuid}/contents/`).pipe(
    //         catchError(error => {
    //             this.isLoading = false;
    //             this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
    //             throw error;
    //         })
    //     );

    //     forkJoin([clusterRequest, coordsMetadataRequest]).subscribe(([clusterRes, coordsMetadataRes]) => {
    //         this.isLoading = false;
    //         if (Array.isArray(clusterRes) && clusterRes.length > 0 && clusterRes[0].hasOwnProperty('rowname') && clusterRes[0].hasOwnProperty('values')) {
    //             for (let index in clusterRes) {
    //                 let key = clusterRes[index]['rowname']
    //                 let clusterid = clusterRes[index]['values']['clusterid']
    //                 this.dataDict[key] = {
    //                     ...this.dataDict[key],
    //                     clusterid
    //                 };
    //             }

    //             for (let i in coordsMetadataRes) {
    //                 let obj = coordsMetadataRes[i];
    //                 let key = obj['rowname'];
    //                 let xVal = obj['values'][this.xAxisValue]
    //                 let yVal = obj['values'][this.yAxisValue]
    //                 this.dataDict[key] = {
    //                     ...this.dataDict[key],
    //                     xVal,
    //                     yVal
    //                 };

    //             }

    //             let colorLabels = {};

    //             for (let i in this.dataDict) {
    //                 const parsedX = parseInt(this.dataDict[i]['xVal'])
    //                 const parsedY = parseInt(this.dataDict[i]['yVal'])
    //                 const clusterid = this.dataDict[i]['clusterid']

    //                 if (!isNaN(parsedX) && !isNaN(parsedY) && clusterid) {
    //                     let clusterName = "Cluster " + clusterid
    //                     let temp = {
    //                         "xValue": parsedX,
    //                         "yValue": parsedY,
    //                         "clusterid": clusterid
    //                     }
    //                     //this allows for the colors to be repeated 
    //                     let clusterNumber = parseInt(clusterid)
    //                     if (!colorLabels[clusterNumber]) {
    //                         colorLabels[clusterNumber] = 1;
    //                         let remainder = clusterNumber % this.clusterColors.length;
    //                         let colorObj = {
    //                             "label": clusterName,
    //                             "color": remainder === 0 ? this.clusterColors[this.clusterColors.length - 1] : this.clusterColors[remainder - 1]
    //                         }
    //                         this.clusterTypes[clusterName] = colorObj
    //                         this.clusterList.push(clusterName)
    //                     }

    //                     this.scatterPlotDataCluster.push(temp)

    //                     this.xMin = Math.min(this.xMin, parsedX);
    //                     this.xMax = Math.max(this.xMax, parsedX);

    //                     this.yMin = Math.min(this.yMin, parsedY);
    //                     this.yMax = Math.max(this.yMax, parsedY);
    //                 }
    //             }

    //             let normalizePlot = (this.xMax - this.xMin) / this.normalizePlotWidth // This will set the plot to a width of 300px
    //             this.plotWidth = (this.xMax - this.xMin) / normalizePlot;
    //             this.plotHeight = (this.yMax - this.yMin) / normalizePlot;

    //             // this.imageOverlayOffset = this.plotWidth - this.legendWidth

    //             for (let geneName in this.dataDict) {
    //                 const parsedX = parseInt(this.dataDict[geneName]['xVal'])
    //                 const parsedY = parseInt(this.dataDict[geneName]['yVal'])
    //                 const clusterid = this.dataDict[geneName]['clusterid']

    //                 if (!isNaN(parsedX) && !isNaN(parsedY) && clusterid) {
    //                     let clusterName = "Cluster " + clusterid
    //                     if (!this.observationSetsClusters[clusterName]) {
    //                         this.observationSetsClusters[clusterName] = []
    //                     }
    //                     let geneObj = {
    //                         id: geneName
    //                     }
    //                     this.observationSetsClusters[clusterName].push(geneObj)

    //                 }
    //             }

    //             if (this.originalPlotWidth === 0) {
    //                 this.originalPlotWidth = this.plotWidth;
    //                 this.originalPlotHeight = this.plotHeight;
    //             }

    //             // if (this.scatterPlotDataCluster.length > 0) {
    //             //     this.createScatterPlot()
    //             // }
    //         }

    //     });
    // }

    // containerId: string = '#scatter';
    // selectedColor: string = 'Green';
    // colors: string[] = ['Red', 'Green'];
    // createScatterPlot() {
    //     var margin = { top: 0, right: 0, bottom: 0, left: this.legendWidth },
    //         width = this.plotWidth - margin.left - margin.right + this.legendWidth,
    //         height = this.plotHeight - margin.top - margin.bottom;

    //     let scatterplotContainerId = this.containerId;
    //     d3.select(scatterplotContainerId)
    //         .selectAll('svg')
    //         .remove();

    //     const pointTip = d3Tip()
    //         .attr('class', 'd3-tip')
    //         .offset([-10, 0])
    //         .html((event: any, d: any) => {
    //             let tipBox = `<div><div class="category">Cluster ID:</div> ${d.clusterid}</div>`
    //             return tipBox
    //         });

    //     var svg = d3.select(scatterplotContainerId)
    //         .append("svg")
    //         .attr("width", width + margin.left + margin.right)
    //         .attr("height", height + margin.top + margin.bottom)
    //         .append("g")
    //         .attr("transform",
    //             "translate(" + margin.left + "," + margin.top + ")");

    //     svg.call(pointTip);

    //     const color = d3.scaleLinear<string>()
    //         .domain([0, this.totalCountsMax])
    //         .range(["rgb(255,255,224)", this.selectedColor]);

    //     const colorScale = d3.scaleOrdinal<string>()
    //         .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    //         .range(this.clusterColors);

    //     var x = d3.scaleLinear()
    //         .domain([this.xMin, this.xMax])
    //         .range([0, width]);

    //     var y = d3.scaleLinear()
    //         .domain([this.yMin, this.yMax])
    //         .range([height, 0]);

    //     const circles = svg.append('g')
    //         .selectAll("dot")
    //         .data(this.scatterPlotDataCluster)
    //         .enter()
    //         .append("circle")
    //         .attr("cx", function (d) { return x(d.xValue) })
    //         .attr("cy", function (d) { return height - y(d.yValue); })
    //         .attr("r", 1.75)
    //         .attr("fill", d => {
    //             return colorScale(d.clusterid)
    //         })

    //     circles.on('mouseover', function (mouseEvent: any, d) {
    //         d3.select(this).style('cursor', 'pointer');
    //         pointTip.show(mouseEvent, d, this);
    //         pointTip.style('left', mouseEvent.x + 10 + 'px');
    //     })
    //         .on('mouseout', function () {
    //             d3.select(this).style('cursor', 'default');  // Revert cursor to default on mouseout
    //             pointTip.hide();
    //         });

    //     // Add Legend
    //     if (this.legendWidth !== 0) {
    //         const clusterColors = Object.keys(this.clusterTypes).map(key => ({
    //             label: this.clusterTypes[key].label,
    //             color: this.clusterTypes[key].color
    //         }));
    //         clusterColors.sort((a, b) => {
    //             const numA = parseInt(a.label.split(' ')[1]);
    //             const numB = parseInt(b.label.split(' ')[1]);
    //             return numA - numB;
    //         });
    //         const legendWidth = this.legendWidth;

    //         const legend = svg
    //             .selectAll('.legend')
    //             .data(clusterColors)
    //             .enter()
    //             .append('g')
    //             .classed('legend', true)
    //             .attr('transform', function (d, i) {
    //                 return `translate(-${legendWidth},${i * 15 + 50})`;
    //             });

    //         legend
    //             .append('circle')
    //             .attr('r', 4)
    //             .attr('cx', 10)
    //             .attr('fill', d => d.color);

    //         legend
    //             .append('text')
    //             .attr('x', 20)
    //             .attr('dy', '.35em')
    //             .style('fill', '#000')
    //             .style('font-size', '8px')
    //             .attr('class', 'legend-label')
    //             .text(d => d.label);
    //     }
    // }

    saveObsSets(name) {
        const observationSet: CustomSet = {
            name: `${name}_${this.observationSetsClusters[name].length}_${this.clustering_job_id}`,
            type: CustomSetType.ObservationSet,
            color: '#A41034',
            elements: this.observationSetsClusters[name]
        };

        this.analysesForm.value['barcodes'] = observationSet
        this.selectedObsClusterField = observationSet
    }
}