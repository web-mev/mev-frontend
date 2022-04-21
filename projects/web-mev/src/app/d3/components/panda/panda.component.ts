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
import { saveAs } from "file-saver";
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

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
    disableFilter: boolean = true;
    size: string = 'large';
    // isError: boolean = false;
    displayGraph: boolean = true;
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
            fontSize: 8,
            borderWidth: 2,
            edgeWidth: [3, 8]
        }
    };
    // searchValue: string = '';
    currTab: string = 'topGenes';
    addOnBlur: boolean = true;
    readonly separatorKeysCodes = [ENTER, COMMA, SPACE] as const;
    searchTerms: string[] = [];

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService
    ) { }

    ngOnChanges(): void {
        if (this.currTab === 'topGenes') {
            this.displayGraph = true;
            this.requestData('topGenes');
        } 
        // else {
        //     this.displayGraph = false;
        //     this.isLoading = false;
        // }
    }

    requestData(type: string) {
        this.disableFilter = true;
        this.displayGraph = true;
        this.edgeArr = [];
        this.nodesArr = [];
        this.isLoading = true;
        this.sliderValue = 0;
        let pandaMatrixId = this.outputs['MevPanda.panda_output_matrix'];
        let existingNode = {};
        if (this.searchTerms.length === 0 && type === 'Search') {
            let message = "Error: Please enter a search term and try again.";
            this.notificationService.warn(message);
            this.isLoading = false;
        } else if (type === 'topGenes') {
            this.getData(pandaMatrixId).subscribe(res => {
                this.changeToFitCytoscape(res, existingNode)
            })
        } else if (type === 'Search') {
            this.onSearch(pandaMatrixId).subscribe(res => {
                this.changeToFitCytoscape(res, existingNode)
                this.isLoading = false;
            }, error => {
                console.log("Error: ", error)
                let message = "Error: One or more of your search terms are invalid. Please try again.";
                this.notificationService.warn(message)
                this.isLoading = false;
            })
        }
    }

    changeToFitCytoscape(res, existingNode) {
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
        this.disableFilter = false;
        if (this.nodesArr.length < 100) {
            this.size = "large";
        } else if (this.nodesArr.length < 200) {
            this.size = "medium";
        } else {
            this.size = "small";
        }

        let errorMessage = "The current number of genes is more than Cytoscape can handle. Please lower the number of Layers or Children and try again."
        this.nodesArr.length > 1000 ? this.tooManyNodes(errorMessage) : this.render();
    }

    getData(uuid) {
        // this.isError = false;
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
        if (this.nodesArr.length > 0) this.render();
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

    onSaveImagePNG() {
        let b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
            const byteCharacters = atob(b64Data);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                const slice = byteCharacters.slice(offset, offset + sliceSize);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, { type: contentType });
            return blob;
        }
        let b64key = 'base64,';
        let b64 = this.cy.png().substring(this.cy.png().indexOf(b64key) + b64key.length);
        let imgBlob = b64toBlob(b64, 'image/png');
        saveAs(imgBlob, 'cytoscape.png');
    }

    onSearch(uuid) {
        let genes = this.searchTerms.join(",")
        let endPoint = `${this.API_URL}/resources/${uuid}/contents/transform/?transform-name=pandasubset&maxdepth=${this.selectedLayers}&children=${this.selectedChildren}&axis=${this.apiAxis}&initial_nodes=${genes}`;
        return this.httpClient.get(endPoint)
    }

    addSearchItem(event: MatChipInputEvent): void {
        const value = (event.value || '').trim().toUpperCase();
        let index = this.searchTerms.indexOf(value);
        if (index !== -1) {
            this.notificationService.warn(`"${value}" has already been added`);
        }
        if (value && index === -1) {
            this.searchTerms.push(value);
        }
        event.chipInput!.clear();
    }

    removeSearchItem(term): void {
        const index = this.searchTerms.indexOf(term);
        if (index >= 0) {
            this.searchTerms.splice(index, 1);
        }
    }

    tabChange() {
        //resets options on each tab change
        this.disableFilter = true;
        this.searchTerms = [];
        this.selectedLayers = 2;
        this.selectedChildren = 3;
        this.currLayout = this.layoutList[1];
        this.layoutName = "cose-bilkent";
        this.apiAxis = this.radioButtonList[0].axis;
        this.sliderValue = 0;

        this.currTab = (this.currTab === 'topGenes') ? 'searchGenes' : 'topGenes';
        if (this.currTab === 'searchGenes') {
            this.nodesArr = [];
            this.displayGraph = false;
            this.isLoading = false;
            this.render()
        } else if (this.currTab === 'topGenes') {
            this.requestData('topGenes');
        }
    }

    render() {
        this.cy = cytoscape({
            container: document.getElementById('cy'),
            elements: {
                nodes: this.displayGraph ? this.nodesArr : [],
                edges: this.displayGraph ? this.edgeArr : [],
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
            },
        })
    }
}