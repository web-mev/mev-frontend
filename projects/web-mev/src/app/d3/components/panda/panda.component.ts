import { Component, ChangeDetectionStrategy, OnChanges, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import layoutUtilities from 'cytoscape-layout-utilities';

cytoscape.use(fcose);
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
    isLoading = false;
    containerId = '#panda';
    imageName = 'PANDA'; // file name for downloaded SVG image
    selectedLayers: number = 2;
    selectedChildren: number = 3;
    radioButtonList = [0, 1];
    layersList: number[] = [2, 3, 4, 5, 6, 7];
    childrenList: number[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    apiAxis: number = this.radioButtonList[0];
    windowWidth: any;
    sliderValue: any = 0;
    copyNodesArr = [];
    copyEdgeArr = [];
    hideFilter: boolean = true;

    constructor(private httpClient: HttpClient) { }

    ngOnChanges(): void {
        this.windowWidth = window.innerWidth;
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
                            "truncatedId": nodeId.length > 5 ? nodeId.slice(0, 7) + "\n" + nodeId.slice(7) : nodeId
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
                                "truncatedId": childId.length > 8 ? childId.slice(0, 7) + "\n" + childId.slice(7) : childId
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
            this.render();
        })
    }

    getData(uuid) {
        let endPoint = `${this.API_URL}/resources/${uuid}/contents/transform/?transform-name=pandasubset&maxdepth=${this.selectedLayers}&children=${this.selectedChildren}&axis=${this.apiAxis}`;
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    console.log("Error: ", error);
                    throw error;
                }))
    }

    onRadioChange(axis) {
        this.apiAxis = axis;
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
                        'label': 'data(truncatedId)',
                        'shape': 'diamond',
                        'text-wrap': 'wrap',
                        'text-max-width': '1000px',
                        'text-halign': 'center',
                        'text-valign': 'center',
                        'height': 100,
                        'width': 100,
                        'border-color': '#000',
                        'border-width': 3,
                        'border-opacity': 0.8,
                        'color': 'white',
                        'font-weight': 'bold',
                    }
                },
                {
                    selector: 'node[interaction="pd"]',
                    style: {
                        'background-color': "#D94A4A",
                        'label': 'data(truncatedId)',
                        'shape': 'round-rectangle',
                        'text-wrap': 'wrap',
                        'text-max-width': '1000px',
                        'text-halign': 'center',
                        'text-valign': 'center',
                        'height': 100,
                        'width': 100,
                        'border-color': '#000',
                        'border-width': 3,
                        'border-opacity': 0.8,
                        'color': 'white',
                        'font-weight': 'bold',
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': `mapData(edge_weight, ${this.minEdgeWeight}, ${this.maxEdgeWeight}, 2, 8)`,
                        'line-color': "black",
                        'line-opacity': 0.5,
                    }
                },
            ],
            layout:
            {
                name: 'fcose',
            }
        });
    }

}