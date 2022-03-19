import { Component, ChangeDetectionStrategy, OnChanges, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';

cytoscape.use(fcose);
import layoutUtilities from 'cytoscape-layout-utilities';
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
    allNodes = {};
    minEdgeWeight: number = 100;
    maxEdgeWeight: number = 0;
    isLoading = true;
    containerId = '#panda';
    imageName = 'PANDA'; // file name for downloaded SVG image

    constructor(private httpClient: HttpClient) { }

    ngOnChanges(): void {
        console.log("outputs: ", this.outputs)
        let pandaExprsMatrixId = this.outputs['MevPanda.exprs_file']
        let pandaMatrixId = this.outputs['MevPanda.panda_output_matrix']
        this.getData(pandaMatrixId).subscribe(res => {
            for (let node of res['nodes']) {
                let nodeId = Object.keys(node)[0];
                if (!this.allNodes[nodeId]) {
                    let newNode = {
                        "data": {
                            "id": nodeId,
                            "interaction": node[nodeId].axis === 0 ? "pd" : "dp",
                            "truncatedId": nodeId.length > 5 ? nodeId.slice(0, 6) + " \n " + nodeId.slice(7) : nodeId
                        }
                    }
                    this.nodesArr.push(newNode);
                    this.allNodes[nodeId] = 1;
                }

                for (let child of node[nodeId].children) {
                    let childId = Object.keys(child)[0];
                    if (!this.allNodes[childId]) {
                        let newNode = {
                            "data": {
                                "id": childId,
                                //Set to be opposite of its parent
                                "interaction": node[nodeId].axis === 1 ? "pd" : "dp",
                                "truncatedId": childId.length > 6 ? childId.slice(0, 6) + " \n " + childId.slice(7) : childId
                            }
                        }
                        this.nodesArr.push(newNode);
                        this.allNodes[childId] = 1;

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
            }
            // console.log(this.minEdgeWeight, this.maxEdgeWeight)
            this.isLoading = false;
            this.render();
        })
    }

    getData(uuid) {
        let endPoint = `${this.API_URL}/resources/${uuid}/contents/transform/?transform-name=pandasubset&maxdepth=2&children=3&axis=0`;
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    console.log("Error: ", error);
                    throw error;
                }))
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
                            return ele.data("interaction") === "pd" ? "#1DA1F2" : "#D94A4A";
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