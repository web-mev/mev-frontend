import { Component, ChangeDetectionStrategy, Input, AfterViewInit } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AnalysesService } from '../../../features/analysis/services/analysis.service';

cytoscape.use(fcose);
cytoscape.use(cola);
cytoscape.use(coseBilkent);
cytoscape.use(cise);
cytoscape.use(layoutUtilities);

@Component({
    selector: 'mev-dragon',
    templateUrl: './dragon.component.html',
    styleUrls: ['./dragon.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})

export class DragonComponent implements AfterViewInit {
    @Input() outputs;
    @Input() showHeader: boolean;
    @Input() startLoading: boolean;
    @Input() onClick: boolean;
    private readonly API_URL = environment.apiUrl;

    cy: any;
    nodesArr = [];
    edgeArr = [];
    minEdgeWeight: number = 100;
    maxEdgeWeight: number = 0;
    roundMaxEdgeWeight: number = 1;
    minPVal: number = 1000;
    maxPVal: number = 0;
    isLoading: boolean = false;
    containerId = '#dragon';
    imageName = 'DRAGON'; // file name for downloaded SVG image
    schemeList = [
        {
            name: "Max Edges",
            id: "max_edges"
        },
        {
            name: "Max Weight",
            id: "max_weight"
        },
        {
            name: "Node List",
            id: "node_list"
        }
    ];
    layoutList: string[] = ["Cose", "Cose-Bilkent", "FCose", "Cise", "Cola"];
    currLayout: string = this.layoutList[1];
    layoutName: string = "cose-bilkent";
    currScheme = "max_weight"
    windowWidth: any;
    sliderValue: any = 0;
    copyNodesArr = [];
    copyEdgeArr = [];
    disableFilter: boolean = true;
    size: string = 'large';
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
            fontSize: 7,
            borderWidth: 2,
            edgeWidth: [3, 8]
        }
    };

    addOnBlur: boolean = true;
    readonly separatorKeysCodes = [ENTER, COMMA, SPACE] as const;
    nodeList: string[] = [];
    hasBeenInitialized = false;

    workspaceId = '';
    uuid = '';

    topNVal = 5;
    sigThresholdVal = 0.01;
    maxNeighborsVal = 2

    constructor(
        private route: ActivatedRoute,
        private apiService: AnalysesService,
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
        public dialog: MatDialog,
    ) { }

    ngAfterViewInit(): void {
        this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
        this.apiService.getExecOperations(this.workspaceId).subscribe(res => {
            this.uuid = res[0]['id']
            if ((this.showHeader !== false) || (this.startLoading === true && this.showHeader === false)) {
                this.displayGraph = true;
                this.requestData('topGenes');
                this.scrollTo('radio-group-axis');
            }
            this.hasBeenInitialized = true;
        })
    }

    scrollTo(htmlID) {
        const element = document.getElementById(htmlID) as HTMLElement;
        element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }

    requestData(type: string) {
        this.disableFilter = true;
        this.displayGraph = true;
        this.edgeArr = [];
        this.nodesArr = [];
        this.isLoading = true;
        this.sliderValue = 0;

        if (type === 'topGenes') {
            this.getData().subscribe(res => {
                this.changeToFitCytoscape(res)
                this.scrollTo('minimumEdgeWeight');
            })
        } 
    }

    changeToFitCytoscape(res) {
        for (let nodeObj of res['nodes']) {
            let nodeID = nodeObj['id']
            let newNode = {
                "data": {
                    "id": nodeID,
                    "interaction": 'test',
                    "truncatedId": nodeID.length > 6 ? nodeID.slice(0, 5) + "\n" + nodeID.slice(5, 10) + "\n" + nodeID.slice(10) : nodeID
                }
            }
            this.nodesArr.push(newNode)
        }

        for (let edgeObj of res['edges']) {
            let source = edgeObj['source']
            let target = edgeObj['target']
            let currEdgeWeight = edgeObj['weight']
            let currPVal = edgeObj['pval']
            let currDirection = edgeObj['direction']
            let newEdge = {
                "data": {
                    "id": source + "_" + target,
                    "source": source,
                    "target": target,
                    "interaction": "test",
                    "edge_weight": currEdgeWeight,
                    "pval": currPVal,
                    "direction": currDirection
                }
            }
            this.edgeArr.push(newEdge)

            this.maxEdgeWeight = Math.max(this.maxEdgeWeight, currEdgeWeight);
            this.minEdgeWeight = Math.min(this.minEdgeWeight, currEdgeWeight);

            this.maxPVal = Math.max(this.maxPVal, currPVal);
            this.minPVal = Math.min(this.minPVal, currPVal);
        }
        this.roundMaxEdgeWeight = Math.ceil(this.maxEdgeWeight * 100) / 100;

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

        let errorMessage = "The current number of nodes is more than Cytoscape can handle. Please adjust some of the filtering options and try again."
        this.nodesArr.length > 1000 ? this.tooManyNodes(errorMessage) : this.render();
    }

    getData() {
        let endPoint = ''
        if(this.currScheme === 'node_list'){
            let nodes = this.nodeList.join(",")
            endPoint = `${this.API_URL}/executed-operations/${this.uuid}/results-query/?transform-name=networksubset&weights=Dragon.edge_weights&pvals=Dragon.fdr_values&sig_threshold=${this.sigThresholdVal}&scheme=${this.currScheme}&nodes=${nodes}`
            if(this.maxNeighborsVal !== null){
                let tempString = `&max_neighbors=${this.maxNeighborsVal}`
                endPoint += tempString
            } 
        }else{
            endPoint = `${this.API_URL}/executed-operations/${this.uuid}/results-query/?transform-name=networksubset&weights=Dragon.edge_weights&pvals=Dragon.fdr_values&sig_threshold=${this.sigThresholdVal}&scheme=${this.currScheme}&top_n=${this.topNVal}`
            if(this.maxNeighborsVal !== null){
                let tempString = `&max_neighbors=${this.maxNeighborsVal}`
                endPoint += tempString
            }
        }

        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    let message = `Error: ${error.error.error}`
                    this.notificationService.warn(message)
                    this.isLoading = false;
                    throw error;
                }))
    }

    onRadioChangeScheme(scheme) {
        this.currScheme = scheme;
    }

    onRadioChangeLayout(layout) {
        this.currLayout = layout;
        this.layoutName = layout.toLowerCase();
        if (this.nodesArr.length > 0) this.render();
    }

    updateMinEdgeWeightSlider(input) {
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
        saveAs(imgBlob, `${this.imageName}.png`);
    }

    addNodeItem(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();
        let index = this.nodeList.indexOf(value);
        if (index !== -1) {
            this.notificationService.warn(`Error: "${value}" has already been added to the search query.`);
        }
        if (value && index === -1) {
            this.nodeList.push(value);
        }
        event.chipInput!.clear();
    }

    removeNodeItem(term): void {
        const index = this.nodeList.indexOf(term);
        if (index >= 0) {
            this.nodeList.splice(index, 1);
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
                    selector: 'node',
                    style: {
                        'background-color': "#D94A4A",
                        'opacity': 0.95,
                        'label': 'data(truncatedId)',
                        'shape': 'ellipse',
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
                        'line-color': (ele) => ele.data('direction') === 'POS' ? '#A41034' : '#1F51FF',
                        'line-opacity': (ele) => {
                            let pval = ele.data('pval')
                            // Scales the opacity from Sig_threshold and Zero. So, if sig_thresold = 0.01, we can make 0.01 --> transparency of 10%. and 0 --> transparency of 100%
                            let resultOpacity = (1 - pval / this.sigThresholdVal) * .9 + .1 // sets a minimum of 10% opapcity
                            return resultOpacity
                        }

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