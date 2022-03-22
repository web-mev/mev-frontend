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
    layersList = [2,3,4,5,6,7];
    childrenList = [3,4,5,6,7,8,9,10,11,12,13,14,15]
    apiAxis: number = this.radioButtonList[0];
    windowWidth: any;

    constructor(private httpClient: HttpClient) { }

    ngOnChanges(): void {
        this.windowWidth = window.innerWidth;
    }

    requestData(){
        this.edgeArr = [];
        this.nodesArr = [];
        this.isLoading = true;
        console.log("apiAxis: ", this.apiAxis);
        let pandaExprsMatrixId = this.outputs['MevPanda.exprs_file']
        let pandaMatrixId = this.outputs['MevPanda.panda_output_matrix']
        this.getData(pandaMatrixId).subscribe(res => {
            console.log("res: ", res)
            for (let node of res['nodes']) {
                let nodeId = Object.keys(node)[0];
                let newNode = {
                    "data": {
                        "id": nodeId,
                        "interaction": node[nodeId].axis === 0 ? "pd" : "dp",
                        "truncatedId": nodeId.length > 5 ? nodeId.slice(0, 6) + " \n " + nodeId.slice(7) : nodeId
                    }
                }
                this.nodesArr.push(newNode);

                for (let child of node[nodeId].children) {
                    let childId = Object.keys(child)[0];
                    let newNode = {
                        "data": {
                            "id": childId,
                            //Set to be opposite of its parent
                            "interaction": node[nodeId].axis === 1 ? "pd" : "dp",
                            "truncatedId": childId.length > 8 ? childId.slice(0, 6) + " \n " + childId.slice(7) : childId
                        }
                    }
                    this.nodesArr.push(newNode);

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
            console.log("edge: ", this.edgeArr)
            this.isLoading = false;
            this.render();
        })
    }

    getData(uuid) {
        let endPoint = `${this.API_URL}/resources/${uuid}/contents/transform/?transform-name=pandasubset&maxdepth=${this.selectedLayers}&children=${this.selectedChildren}&axis=${this.apiAxis}`;
        console.log("endpoint: ", endPoint)
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    console.log("Error: ", error);
                    throw error;
                }))
    }

    onRadioChange(axis) {
        this.apiAxis = axis;
        console.log('axis: ', this.apiAxis)
    }

    onDropDownChange(value, dropdown){
        if(dropdown === 'layers') this.selectedLayers = value;
        if(dropdown === 'children') this.selectedChildren = value;
        console.log(this.selectedChildren, this.selectedLayers);
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
                        'background-color': (ele) => {
                            return ele.data("interaction") === "dp" ? "#1DA1F2" : "#D94A4A";
                        },
                        'label': 'data(truncatedId)',
                        'shape': 'diamond',
                        'text-wrap': 'wrap',
                        'text-max-width': '1000px',
                        'text-halign': 'center',
                        'text-valign': 'center',
                        'height': 120,
                        'width': 120,
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
                        // 'curve-style': 'bezier'
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