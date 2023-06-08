import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { environment } from '@environments/environment';
import * as cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import cise from 'cytoscape-cise';
// import layoutUtilities from 'cytoscape-layout-utilities';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { forkJoin } from 'rxjs';

cytoscape.use(fcose);
cytoscape.use(cola);
cytoscape.use(coseBilkent);
cytoscape.use(cise);
// cytoscape.use(layoutUtilities);

@Component({
    selector: 'mev-snf',
    templateUrl: './snf.component.html',
    styleUrls: ['./snf.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SNFComponent implements OnInit {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;

    isLoading: boolean = false;

    cy: any;

    layoutName: string = "cise";
    layoutList: string[] = ["Cose", "Cose-Bilkent", "FCose", "Cise", "Cola"];
    currLayout: string = this.layoutList[3];
    nodeSize = {
        small: {
            height: 10,
            width: 10,
            fontSize: 2,
            borderWidth: 1,
            edgeWidth: [1, 2]
        },
        medium: {
            height: 20,
            width: 20,
            fontSize: 4,
            borderWidth: 1,
            // edgeWidth: [1, 5]
            edgeWidth: [1, 10]
        },
        large: {
            height: 40,
            width: 40,
            fontSize: 7,
            borderWidth: 2,
            edgeWidth: [3, 8]
        }
    };
    size = "medium";
    existingNode = {};
    existingEdge = {};
    nodesArr = [];
    minEdgeWeight = 1000;
    maxEdgeWeight = 0;
    edgeArr = [];
    edgeWeightArr = [];
    clusterNodes = {};
    edgeWeightFilter = 0;
    sliderValue: any = 5;
    disableFilter: boolean = true;
    similarityThreshold = this.sliderValue / 100;
    currSimilarityData
    currClusterData

    constructor(
        private apiService: AnalysesService,
    ) { }

    ngOnInit(): void {
        this.isLoading = true;
        let snf_similarityId = this.outputs['snf_similarity'];
        let snf_clusteringId = this.outputs['snf_clustering'];
        forkJoin([
            this.apiService.getResourceContent(snf_similarityId),
            this.apiService.getResourceContent(snf_clusteringId)
        ]).subscribe(([similarityData, clusterData]) => {
            this.currSimilarityData = similarityData;
            this.currClusterData = clusterData;
            this.formatForCytoscape(similarityData, clusterData);
        });
    }

    onRadioChangeLayout(layout) {
        this.isLoading = true;
        this.currLayout = layout;
        this.layoutName = layout.toLowerCase();
        if (this.nodesArr.length > 0) {
            //Use a timer so that the loading animation can display before the screen freezes to load Cytoscape.
            setTimeout(() => {
                this.render();
            }, 100);
        }
    }

    formatForCytoscape(similarityData, clusterData) {
        for (let j = 0; j < clusterData.length; j++) {
            let node = clusterData[j]['rowname'];
            let value = clusterData[j]['values']['cluster']
            this.clusterNodes[node] = value;
        }

        //this loop is to get the top 5% of edgeWeights
        for (let i = 0; i < similarityData.length; i++) {
            let nodeId = similarityData[i]['rowname'];
            for (let key in similarityData[i]['values']) {
                let childId = key;
                let currEdgeWeight = similarityData[i]['values'][key];

                if (nodeId !== childId) {
                    this.edgeWeightArr.push(currEdgeWeight)
                }
            }
        }
        this.edgeWeightArr.sort((a, b) => b - a)
        let filterValue = Math.round(this.edgeWeightArr.length * this.similarityThreshold)
        this.edgeWeightFilter = this.edgeWeightArr[filterValue]

        for (let i = 0; i < similarityData.length; i++) {
            let nodeId = similarityData[i]['rowname'];

            for (let key in similarityData[i]['values']) {
                let childId = key;
                let currEdgeWeight = similarityData[i]['values'][key];
                let newEdge = {
                    "data": {
                        "id": nodeId + "_" + childId,
                        "source": nodeId,
                        "target": childId,
                        "edge_weight": currEdgeWeight
                    }
                }

                if (currEdgeWeight > this.edgeWeightFilter && nodeId !== childId) {
                    this.maxEdgeWeight = Math.max(this.maxEdgeWeight, currEdgeWeight);
                    this.minEdgeWeight = Math.min(this.minEdgeWeight, currEdgeWeight);

                    if (!this.existingEdge[nodeId + '_' + childId]
                        && !this.existingEdge[childId + '_' + nodeId]
                        && nodeId !== childId) {
                        this.edgeArr.push(newEdge);
                        this.existingEdge[nodeId + '_' + childId] = 1;
                        this.existingEdge[childId + '_' + nodeId] = 1;
                    }

                    if (!this.existingNode[nodeId]) {
                        let newNode = {
                            "data": {
                                "id": nodeId,
                                "clusterID": this.clusterNodes[nodeId]
                            }
                        }
                        this.nodesArr.push(newNode);
                        this.existingNode[nodeId] = 1;
                    }

                    if (!this.existingNode[childId]) {
                        let newNode = {
                            "data": {
                                "id": childId,
                                "clusterID": this.clusterNodes[childId]
                            }
                        }
                        this.nodesArr.push(newNode);
                        this.existingNode[childId] = 1;
                    }
                }
            }
        }

        if (this.nodesArr.length > 0) {
            setTimeout(() => {
                this.render();
            }, 100);
        }
    }

    updateSlider(input) {
        this.sliderValue = input.value;
        this.similarityThreshold = input.value / 100;
        this.disableFilter = false;
    }

    resetVariables() {
        this.nodesArr = [];
        this.edgeArr = [];
        this.existingNode = {};
        this.existingEdge = {};
        this.minEdgeWeight = 1000;
        this.maxEdgeWeight = 0;
    }

    filterThreshold() {
        this.isLoading = true;
        this.disableFilter = true;
        this.resetVariables();
        setTimeout(() => {
            this.formatForCytoscape(this.currSimilarityData, this.currClusterData);
        }, 100);
    }

    render() {
        this.cy = cytoscape({
            container: document.getElementById('cy'),
            elements: {
                nodes: this.nodesArr,
                edges: this.edgeArr,
            },
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': "#1DA1F2",
                        'opacity': 0.95,
                        'label': 'data(id)',
                        'shape': 'ellipse',
                        'text-wrap': 'wrap',
                        'text-max-width': '1000px',
                        'text-halign': 'center',
                        'text-valign': 'center',
                        'border-color': '#000',
                        'border-opacity': 0.8,
                        'color': 'white',
                        'font-weight': 'bold',
                        'height': this.nodeSize[this.size].height,
                        'width': this.nodeSize[this.size].width,
                        'font-size': this.nodeSize[this.size].fontSize,
                        'border-width': this.nodeSize[this.size].borderWidth,
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': `mapData(edge_weight, ${this.minEdgeWeight}, ${this.maxEdgeWeight}, ${this.nodeSize[this.size].edgeWidth[0]}, ${this.nodeSize[this.size].edgeWidth[1]})`,
                        'line-color': "#A4A4A4",
                    },
                },
            ],
            layout: {
                name: this.layoutName,
                ready: function () { this.isLoading = false }.bind(this),
            }
        })
        if (this.layoutName === 'cise') {
            this.cy.layout({
                name: 'cise',
                clusters: function (node) {
                    return node['_private']['data']['clusterID'];
                },
                animate: false,
                refresh: 10,
                animationDuration: undefined,
                animationEasing: undefined,
                fit: true,
                padding: 30,
                nodeSeparation: 12.5,
                idealInterClusterEdgeLengthCoefficient: 1.4,
                allowNodesInsideCircle: true,
                maxRatioOfNodesInsideCircle: 0.1,
                springCoeff: 0.45,
                nodeRepulsion: 4500,
                gravity: 0.25,
                gravityRange: 3.8,
                nodeDimensionsIncludeLabels: true,
                ready: function () { },
                stop: function () { },
            }).run();
        }
    }


}