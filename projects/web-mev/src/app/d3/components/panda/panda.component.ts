import { Component, ChangeDetectionStrategy, OnChanges, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import { NotificationService } from '@core/notifications/notification.service';
import * as cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import cise from 'cytoscape-cise';
import layoutUtilities from 'cytoscape-layout-utilities';

cytoscape.use(fcose);
cytoscape.use(cola);
cytoscape.use(coseBilkent);
cytoscape.use(cise);
cytoscape.use(layoutUtilities);

@Component({
    selector: 'mev-panda',
    templateUrl: './panda.component.html',
    styleUrls: ['./panda.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class PandaComponent implements OnChanges {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;
    cy: any;
    nodesArr = [];
    edgeArr = [];
    elementsArr = [];
    minEdgeWeight: number = 100;
    maxEdgeWeight: number = 0;
    isLoading: boolean = false;
    containerId = '#panda';
    imageName = 'PANDA'; // file name for downloaded SVG image
    selectedLayers: number = 2;
    selectedChildren: number = 3;
    radioButtonList = [
        {
            name: "Genes",
            axis: 0
        },
        {
            name: "Transcription Factor",
            axis: 1
        }
    ];
    layersList: number[] = [2, 3, 4, 5];
    childrenList: number[] = [3, 4, 5, 6, 7, 8, 9, 10];
    layoutList: string[] = ["Cose", "Cose-Bilkent", "FCose", "Cise", "Cola"];
    currLayout: string = this.layoutList[1];
    layoutName: string = "cose-bilkent";
    apiAxis = this.radioButtonList[0].axis;
    windowWidth: any;
    sliderValue: any = 0;
    copyNodesArr = [];
    copyEdgeArr = [];
    hideFilter: boolean = true;
    size: string = 'large';
    isError: boolean = false;
    displayGraph: boolean = true;
    nodeSize = {
        small: {
            height: 10,
            width: 10,
            fontSize: 2,
            borderWidth: 0,
            edgeWidth: [1, 2]
        },
        medium: {
            height: 20,
            width: 20,
            fontSize: 4,
            borderWidth: 1,
            edgeWidth: [1, 5]
        },
        large: {
            height: 60,
            width: 60,
            fontSize: 10,
            borderWidth: 2,
            edgeWidth: [3, 8]
        }
    }

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService
    ) { }

    ngOnChanges(): void {
        // this.windowWidth = window.innerWidth
        this.windowWidth = 4000
        this.requestData();
    }

    requestData() {
        this.hideFilter = true;
        this.edgeArr = [];
        this.nodesArr = [];
        this.isLoading = true;
        let pandaExprsMatrixId = this.outputs['MevPanda.exprs_file'];
        let pandaMatrixId = this.outputs['MevPanda.panda_output_matrix'];
        let existingNode = {}
        this.getData(pandaMatrixId).subscribe(res => {
            for (let node of res['nodes']) {
                let nodeId = Object.keys(node)[0];
                if (!existingNode[nodeId]) {
                    let newNode = {
                        "data": {
                            "id": nodeId,
                            "interaction": node[nodeId].axis === 0 ? "pd" : "dp",
                            "truncatedId": nodeId.length > 6 ? nodeId.slice(0, 5) + "\n" + nodeId.slice(5, 10) + "\n" + nodeId.slice(10) : nodeId
                        }
                    }
                    this.nodesArr.push(newNode);
                    existingNode[nodeId] = 1;
                }

                for (let child of node[nodeId].children) {
                    let childId = Object.keys(child)[0];
                    if (!existingNode[childId]) {
                        let newNode = {
                            "data": {
                                "id": childId,
                                //Set to be opposite of its parent
                                "interaction": node[nodeId].axis === 1 ? "pd" : "dp",
                                "truncatedId": childId.length > 6 ? childId.slice(0, 5) + "\n" + childId.slice(5, 10) + "\n" + childId.slice(10) : childId
                            }
                        }
                        this.nodesArr.push(newNode);
                        existingNode[childId] = 1;
                    }

                    let currEdgeWeight = child[childId];
                    this.maxEdgeWeight = Math.max(this.maxEdgeWeight, currEdgeWeight);
                    this.minEdgeWeight = Math.min(this.minEdgeWeight, currEdgeWeight);

                    let newEdge = {
                        "data": {
                            "id": nodeId + "_" + childId,
                            "source": nodeId,
                            "target": childId,
                            "interaction": node[nodeId].axis === 0 ? "pd" : "dp",
                            "edge_weight": child[childId]
                        }
                    }
                    this.edgeArr.push(newEdge)
                }
            }

            this.copyNodesArr = this.nodesArr;
            this.copyEdgeArr = this.edgeArr;

            this.isLoading = false;
            this.hideFilter = false;
            if (this.nodesArr.length < 100) {
                this.size = "large";
            } else if (this.nodesArr.length < 200) {
                this.size = "medium";
            } else {
                this.size = "small";
            }
            let errorMessage = "The current number of genes is more than Cytoscape can handle. Please lower the number of Layers or Children and try again."
            this.nodesArr.length > 1000 ? this.tooManyNodes(errorMessage) : this.render();
        })
    }

    getData(uuid) {
        this.isError = false;
        this.displayGraph = true;
        let endPoint = `${this.API_URL}/resources/${uuid}/contents/transform/?transform-name=pandasubset&maxdepth=${this.selectedLayers}&children=${this.selectedChildren}&axis=${this.apiAxis}`;
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    console.log("Error: ", error);
                    throw error;
                }))
    }

    onRadioChangeAxis(axis) {
        this.apiAxis = axis;
    }

    onRadioChangeLayout(layout) {
        this.currLayout = layout;
        this.layoutName = layout.toLowerCase();
    }

    onDropDownChange(value, dropdown) {
        if (dropdown === 'layers') this.selectedLayers = value;
        if (dropdown === 'children') this.selectedChildren = value;
    }

    updateSlider(input) {
        this.sliderValue = input.value;
    }

    filterEdges() {
        this.edgeArr = this.copyEdgeArr;
        this.nodesArr = this.copyNodesArr;

        let nodesToKeep = {};
        this.edgeArr = this.edgeArr.filter(e => {
            if (e.data.edge_weight > this.sliderValue) {
                nodesToKeep[e.data.target] = 1;
                nodesToKeep[e.data.source] = 1;
            }
            return e.data.edge_weight > this.sliderValue
        });
        let filteredNodesArr = [];
        for (let node of this.nodesArr) {
            if (nodesToKeep[node.data.id]) {
                filteredNodesArr.push(node)
            }
        }
        this.nodesArr = filteredNodesArr;
        this.render();
    }

    tooManyNodes(message) {
        this.notificationService.warn(message);
        this.displayGraph = false;
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
                    selector: 'node[interaction="dp"]',
                    style: {
                        'background-color': "#1DA1F2",
                        'opacity': 0.95,
                        'label': 'data(truncatedId)',
                        'shape': 'diamond',
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
                    selector: 'node[interaction="pd"]',
                    style: {
                        'background-color': "#D94A4A",
                        'opacity': 0.95,
                        'label': 'data(truncatedId)',
                        'shape': 'round-rectangle',
                        'text-wrap': 'wrap',
                        'text-max-width': '1000px',
                        'text-halign': 'center',
                        'text-valign': 'center',
                        'border-color': '#000',
                        'border-opacity': 0.8,
                        'color': 'white',
                        'font-weight': 'bold',
                        'height': this.nodeSize[this.size].height * 0.9,
                        'width': this.nodeSize[this.size].width * 0.9,
                        'font-size': this.nodeSize[this.size].fontSize,
                        'border-width': this.nodeSize[this.size].borderWidth,
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': `mapData(edge_weight, ${this.minEdgeWeight}, ${this.maxEdgeWeight}, ${this.nodeSize[this.size].edgeWidth[0]}, ${this.nodeSize[this.size].edgeWidth[1]})`,
                        'line-color': "#848484",
                        'line-opacity': 0.8,
                    },
                },
            ],
            layout:
            {
                name: this.layoutName,
                
                // edgeElasticity: (edge) => {
                //     // console.log("edge: ", edge.data().edge_weight)
                //     return edge.data().edge_weight * 40
                // },
                // idealEdgeLength: function (edge) {
                //     // Default is: 10
                //     // Instead, base it on "weight"
                //     return edge.data().edge_weight * 50
                // },
            },
        }).fit(this.cy.elements(), 1000).center()
    }
}