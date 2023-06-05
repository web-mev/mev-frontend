import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { environment } from '@environments/environment';
import * as cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import cise from 'cytoscape-cise';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { forkJoin } from 'rxjs';

cytoscape.use(fcose);
cytoscape.use(coseBilkent);
cytoscape.use(cise);

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

    layoutName: string = "fcose";
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
            edgeWidth: [1, 5]
        },
        large: {
            height: 40,
            width: 40,
            fontSize: 7,
            borderWidth: 2,
            edgeWidth: [3, 8]
        }
    };
    size = "small";
    existingNode = {};
    nodesArr = [];
    minEdgeWeight = 1000;
    maxEdgeWeight = 0;
    edgeArr = [];

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
            console.log("snf stuff: ", similarityData, clusterData)
            this.formatForCytoscape(similarityData, clusterData);
        });
    }

    clusterNodes = {};
    formatForCytoscape(similarityData, clusterData) {
        for (let j = 0; j < clusterData.length; j++) {
            let node = clusterData[j]['rowname'];
            let value = clusterData[j]['values']['cluster']
            this.clusterNodes[node] = value;
        }

        for (let i = 0; i < similarityData.length; i++) {
            let nodeId = similarityData[i]['rowname'];
            if (!this.existingNode[nodeId]) {
                let newNode = {
                    "data": {
                        "id": nodeId,
                        "clusterID": this.clusterNodes[nodeId],
                        // "parent": temp
                    }
                }
                this.nodesArr.push(newNode);
                this.existingNode[nodeId] = 1;
            }

            for (let key in similarityData[i]['values']) {
                let childId = key;
                let currEdgeWeight = similarityData[i]['values'][key];
                this.maxEdgeWeight = Math.max(this.maxEdgeWeight, currEdgeWeight);
                this.minEdgeWeight = Math.min(this.minEdgeWeight, currEdgeWeight);
                let newEdge = {
                    "data": {
                        "id": nodeId + "_" + childId,
                        "source": nodeId,
                        "target": childId,
                        // "interaction": node[nodeId].axis === 0 ? "pd" : "dp",
                        "edge_weight": currEdgeWeight
                    }
                }
                this.edgeArr.push(newEdge)
            }
        }
        console.log("edge: ", this.nodesArr)
        this.isLoading = false;
        this.render()
    }

    render() {
        this.cy = cytoscape({
            container: document.getElementById('cy'),
            elements: {
                // group: 'node[clusterID]',
                nodes: this.nodesArr,
                edges: this.edgeArr.slice(0, 300),
            },
            style: [
                {
                    selector: 'node',
                    // selector: 'node',
                    style: {
                        'background-color': "#1DA1F2",
                        'opacity': 0.95,
                        'label': 'data(id)',
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
                    selector: 'node[clusterID="2"]',
                    style: {
                        'background-color': "#D94A4A",
                        'opacity': 0.95,
                        'label': 'data(id)',
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
                        'width': 1,
                        // 'width': `mapData(edge_weight, ${this.minEdgeWeight}, ${this.maxEdgeWeight}, ${this.nodeSize[this.size].edgeWidth[0]}, ${this.nodeSize[this.size].edgeWidth[1]})`,
                        'line-color': "#848484",
                        'line-opacity': 0.5,
                    },
                },
            ],
            layout:
            {
                name: this.layoutName,
            }
        })

    }
}