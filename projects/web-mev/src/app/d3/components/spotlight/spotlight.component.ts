import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { NotificationService } from '@core/core.module';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';

// interface ScatterDataNormailization {
//     xValue: number;
//     yValue: number;
//     totalCounts: number;
// }
// interface ScatterDataCluster {
//     xValue: number;
//     yValue: number;
//     clusterid: string
// }


@Component({
    selector: 'mev-spotlight',
    templateUrl: './spotlight.component.html',
    styleUrls: ['./spotlight.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpotlightComponent implements OnInit {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;

    isLoading = false;

    xMin = 10000000;
    xMax = 0;
    yMin = 10000000;
    yMax = 0;

    limit = 0.1

    plotData = {};
    plotWidth = 0;
    plotHeight = 0;
    plot_width_in_pixels = 500; //sets the width of the plot in pixels
    originalPlotWidth: number = 0;
    originalPlotHeight: number = 0;

    pieChartColors: any = {};
    colorIndex = 0;
    colorsArray = [
        "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
        "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5",
        "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f",
        "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"
    ];

    // isLoading: boolean = false;

    // scatterPlotData: ScatterDataNormailization[] = [];
    // scatterPlotDataCluster: ScatterDataCluster[] = [];

    dataDict: Record<string, any> = {}

    // xMin: number = 100000000
    // xMax: number = 0
    // yMin: number = 100000000
    // yMax: number = 0
    totalCountsMax: number = 0;
    totalCountsMin: number = 100000000;

    totalCounts: Record<string, any> = {}

    // scaleFactor: number = 0.01602821;
    // geneSearch: string = 'VIM'

    selectedColor: string = 'Green';
    colors: string[] = ['Red', 'Green']

    // plotOpacityValue: number = .7
    // imageOpacityValue: number = .5

    // overlayImage: boolean = false;
    // displayPlot: boolean = false;
    // displayImage: boolean = false;

    // displayAlignment: boolean = false;

    scaleFactorVal = '0.01602821';
    // scaleFactorVal: string = '0';
    geneSearchVal: string = 'VIM'

    moveAmount: number = 1;
    moveAmountVal: string = '1';

    // plotWidth: number = 300;
    // plotHeight: number = 500;

    currentLeft: number = 0;
    currentTop: number = 0;

    // widthAdjustment: number = 0
    // heightAdjustment: number = 0

    droppedFile: File | null = null;
    droppedFileURL: string | ArrayBuffer | null = null;

    imageAdjustedWidth: number = 0;
    maxImageContainerWidthOverylay: number = this.plotWidth;
    maxImageContainerWidthSidebySide: number = this.plotWidth * 2;

    currentZoomScaleFactor: number = 1;
    maxScaleFactor: number = 2;
    minScaleFactor: number = 0.5;

    useCluster: boolean = false;
    useNormalization: boolean = false;

    // legendWidth: number = 120;

    clusterTypes: Record<string, any> = {}
    clusterColors: string[] = ["#EBCD00", "#52A52E", "#00979D", "#6578B4", "#80408D", "#C9006B", "#68666F", "#E80538", "#E87D1E"]

    selectionRectStyle: Record<string, any> = {};

    geneSearchHeight: number = 100;

    analysisType: string = ''

    xAxisValue: string = '';
    yAxisValue: string = ''
    xAxisValueList: string[] = []
    yAxisValueList: string[] = []

    // panelOpenState: boolean = true;

    currentDegree: number = 0;
    scaleXCustom: number = 1;

    showMiniMap = false;

    zoomMin: number = 0.5;
    zoomMax: number = 5;

    // originalPlotWidth: number = 0;
    // originalPlotHeight: number = 0;
    displayOverlayContainer: boolean = true;

    scales: Record<string, number[]> = {
        "0.5": [0, 0],
        "1": [0, 0],
        "2": [50, 150],
        "3": [200, 400],
        "4": [400, 800],
        "5": [800, 1200]
    }
    currentImageLeft: number = 0;
    currentImageTop: number = 0;
    sliderLeft: number = 0;
    sliderTop: number = 0;

    xAxisFlipped: boolean = false;
    yAxisFlipped: boolean = false;
    axisSwapped: boolean = false;

    flipX = 1;
    flipY = 1;

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
    ) { }

    ngOnInit(): void {
        console.log("spotlight outputs: ", this.outputs)
        this.getData()
    }

    getData() {
        this.isLoading = true;
        let deconvoluted_outputs_uuid = this.outputs["deconvoluted_output"];
        let coords_metadata_uuid = this.outputs["coords_metadata"];

        const spotlightRequest = this.httpClient.get(`${this.API_URL}/resources/${deconvoluted_outputs_uuid}/contents/`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from normalized expression request.`);
                console.log("some error message from norm: ", error)
                throw error;
            })
        );


        const coordsMetadataRequest = this.httpClient.get(`${this.API_URL}/resources/${coords_metadata_uuid}/contents/`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
                console.log("some error from coord: ", error)
                throw error;
            })
        );


        forkJoin([spotlightRequest, coordsMetadataRequest]).subscribe(([spotlightRes, coordsMetadataRes]) => {
            this.isLoading = false;
            console.log("coor res: ", coordsMetadataRes)

            for (let index in coordsMetadataRes) {
                let gene = coordsMetadataRes[index]
                let key = gene.rowname
                let x = gene.values["pxl_y"]
                let y = gene.values["pxl_x"]
                this.xMin = Math.min(this.xMin, x)
                this.xMax = Math.max(this.xMax, x)
                this.yMin = Math.min(this.yMin, y)
                this.yMax = Math.max(this.yMax, y)

                this.plotData[key] = {
                    x,
                    y
                }

                let normalizePlot = (this.xMax - this.xMin) / 500 // This will set the plot to a width of 500px
                this.plotWidth = (this.xMax - this.xMin) / normalizePlot;
                this.plotHeight = (this.yMax - this.yMin) / normalizePlot;


            }
            if (this.originalPlotWidth === 0) {
                this.originalPlotWidth = this.plotWidth;
                this.originalPlotHeight = this.plotHeight;
            }
            this.maxImageContainerWidthSidebySide = this.plotWidth * 2;
            console.log("plotwidth: ", this.plotWidth, this.originalPlotWidth)

            console.log("coor results: ", coordsMetadataRes)
            console.log("spotlightRes: ", spotlightRes)


            for (let index in spotlightRes) {
                let gene = spotlightRes[index];
                let geneName = gene.rowname;
                for (const key in gene.values) {

                    if (!this.pieChartColors[geneName]) {
                        this.pieChartColors[geneName] = this.colorsArray[this.colorIndex]
                        this.colorIndex++;
                    }

                    if (gene.values[key] > this.limit) {
                        let temp = {
                            [geneName]: gene.values[key]
                        }
                        let edittedKey = key.replace(".", "-");
                        if (this.plotData[edittedKey]["pieData"] === undefined) {
                            this.plotData[edittedKey]["pieData"] = []
                        }
                        this.plotData[edittedKey]["pieData"].push(temp)
                    }
                }

            }
            console.log("plotdata: ", this.plotData)
            console.log("pie chart: ", this.pieChartColors)
            this.formatData()
        })


    }

    scatterPlotData: any = [];
    geneDict: any = {};
    formatData() {
        for (let index in this.plotData) {
            let obj = this.plotData[index]

            let sum = 0
            if (obj.pieData) {
                for (let geneObj of obj.pieData) {
                    for (const key in geneObj) {
                        sum += Number(geneObj[key])
                    }
                }
                for (let geneObj of obj.pieData) {
                    for (const key in geneObj) {
                        let newVal = Number(geneObj[key]) / sum * 100;
                        let temp = {
                            label: key,
                            value: newVal,
                            name: index
                        }
                        if (!this.plotData[index]["pieData2"]) {
                            this.plotData[index]["pieData2"] = []
                        }
                        this.plotData[index]["pieData2"].push(temp)
                        let temp2 = {
                            label: key,
                            value: newVal
                        }

                        if (!this.geneDict[index]) {
                            this.geneDict[index] = []
                        }
                        this.geneDict[index].push(temp2)

                    }
                }
            }



        }
        //convert to an array. fix this later.
        for (let geneName in this.plotData) {
            this.scatterPlotData.push(this.plotData[geneName])
        }
        this.createScatterplotWithPieCharts('normal')
        this.createScatterplotWithPieCharts('minimap')
        console.log("scatterplot data: ", this.scatterPlotData)
    }
    containerId: string = '#scatter';
    minimapContainerId: string = '#minimapId'

    overlayImage: boolean = false;
    displayPlot: boolean = false;
    displayImage: boolean = false;

    widthAdjustment: number = 0
    heightAdjustment: number = 0

    legendWidth: number = 120;

    scaleFactor: number = 0.0530973;

    displayAlignment: boolean = false;
    plotOpacityValue: number = .9
    imageOpacityValue: number = .5

    createScatterplotWithPieCharts(size: string): void {
        this.displayPlot = true;
        let scatterplotContainerId = size === 'normal' ? this.containerId : this.minimapContainerId;
        const data = this.scatterPlotData
        console.log("data: ", data, this.plotWidth, this.plotHeight)

        // const margin = { top: 10, right: 10, bottom: 10, left: this.legendWidth };
        // const width = this.plotWidth - margin.right;
        // const height = this.plotHeight - margin.top - margin.bottom;

        var margin = { top: 10, right: 10, bottom: 10, left: size === 'normal' ? this.legendWidth : 0 },
            width = size === 'normal' ? this.plotWidth - margin.left - margin.right + this.widthAdjustment + this.legendWidth : (this.plotWidth - margin.left - margin.right + this.widthAdjustment) / 4,
            height = size === 'normal' ? this.plotHeight - margin.top - margin.bottom + this.heightAdjustment : (this.plotHeight - margin.top - margin.bottom + this.heightAdjustment) / 4;


        d3.select(scatterplotContainerId)
            .selectAll('svg')
            .remove();

        const pointTip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event: any, d: any) => {
                // let tipBox = `<div>${d.data.name}</div><div><div class="category">${d.data.label}: ${Math.round(d.data.value)} %</div>`
                let tipBox = `<div class="tipHeader">${d.data.name}</div>`;
                for (let key in this.geneDict[d.data.name]) {
                    tipBox += `<div><div class="tipKey">${this.geneDict[d.data.name][key].label}:</div> ${Math.round(this.geneDict[d.data.name][key].value)}%</div>`
                }
                return tipBox
            });

        const svg = d3.select(scatterplotContainerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        svg.call(pointTip);
        console.log("x diff * scale: ", this.xMin, this.xMax, this.scaleFactor, (this.xMax - this.xMin) * this.scaleFactor)
        console.log("y diff * scale: ", this.yMin, this.yMax, this.scaleFactor, (this.yMax - this.yMin) * this.scaleFactor)

        const x = d3.scaleLinear()
            .domain([this.xMin - 2000, this.xMax + 2000])
            .range([0, width]);
        // svg.append("g")
        //   .attr("transform", "translate(0," + height + ")")
        //   .call(d3.axisBottom(x));

        const y = d3.scaleLinear()
            // .domain([this.yMin * (1 - this.scaleFactor), this.yMax * (1 + this.scaleFactor)])
            .domain([this.yMin - 3000, this.yMax])
            .range([0, height]);
        // svg.append("g")
        //   .call(d3.axisLeft(y));

        // svg.selectAll('dot')
        //   .data(data)
        //   .enter()
        //   .append("circle")
        //   .attr("cx", (d: any) => x(parseInt(d.x)))
        //   .attr("cy", (d: any) => y(parseInt(d.y)))
        //   .attr("r", 3)
        //   .style("fill", "#69b3a2");

        // Add pie charts for each data point
        data.forEach((d: any) => {
            const pie = d3.pie<any>().value((p: any) => p.value);

            // Create arc generator
            // @ts-ignore
            const arc = d3.arc()
                .innerRadius(0)
                .outerRadius(2) as d3.ValueFn<SVGPathElement, d3.PieArcDatum<any>, string | null>

            if (d.pieData2) {
                const pieData = pie(d.pieData2);
                const pieGroup = svg.append("g")
                    .attr("transform", `translate(${x(d.x)}, ${y(d.y)})`);

                pieGroup.selectAll("path")
                    .data(pieData)
                    .enter()
                    .append("path")
                    .attr("d", arc)
                    // .attr("fill", (p: any, i: number) => 
                    //   d3.schemeCategory10[i]
                    // )
                    .attr("fill", (p: any) => {
                        return this.pieChartColors[p.data.label]; // Assuming each data point has a 'key' property
                    });

                pieGroup
                    .data(pieData)
                    .on('mouseover', function (mouseEvent: any, d) {
                        pointTip.show(mouseEvent, d, this);
                        pointTip.style('left', mouseEvent.x + 10 + 'px');
                    })
                    .on('mouseout', pointTip.hide);

            }

        });

        // Add Legend
        const clusterColors = Object.keys(this.pieChartColors).map(key => ({
            label: key,
            color: this.pieChartColors[key]
        }));
        clusterColors.sort((a, b) => {
            // Extracting the numerical part of the label
            const numA = parseInt(a.label.split(' ')[1]);
            const numB = parseInt(b.label.split(' ')[1]);

            // Comparing the numerical parts
            return numA - numB;
        });
        const legend = svg
            .selectAll('.legend')
            .data(clusterColors)
            .enter()
            .append('g')
            .classed('legend', true)
            .attr('transform', function (d, i) {
                return `translate(${-(width + 130)}, ${i * 15 + 50})`;
            });

        legend
            .append('circle')
            .attr('r', 4)
            .attr('cx', width + 20)
            .attr('fill', d => d.color);

        legend
            .append('text')
            .attr('x', width + 30)
            .attr('dy', '.35em')
            .style('fill', '#000')
            .style('font-size', '8px')
            .attr('class', 'legend-label')
            .text(d => d.label);

    }

    captureAndDownloadImages() {
        this.isLoading = true;

        setTimeout(() => {
            let captureContainer = ''
            if (this.droppedFile && !this.overlayImage) {
                captureContainer = '.fullOverlayDiv'
            } else if (this.droppedFile && this.overlayImage) {
                captureContainer = '.overlayDiv'
            } else {
                captureContainer = '#scatter'
            }

            const containerToCapture = document.querySelector(captureContainer) as HTMLElement | null;

            if (containerToCapture) {
                html2canvas(containerToCapture, {
                }).then(canvas => {
                    const dataURL = canvas.toDataURL();
                    const link = document.createElement('a');
                    link.href = dataURL;
                    link.download = 'spatialGE.png';
                    link.click();

                    this.isLoading = false;
                });
            } else {
                this.isLoading = false;
                this.notificationService.error(`Error occurred when downloading the image.`);
                console.error('Container element not found');
            }
        }, 500)
    }

    onDropFile(event: DragEvent) {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.droppedFile = files[0];
            this.displayFile();
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    displayFile() {
        if (this.droppedFile) {
            this.displayImage = true;
            if (this.isImageType(this.droppedFile.type)) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const image = new Image();
                    image.onload = () => {
                        const aspectRatio = image.width / image.height;
                        this.imageAdjustedWidth = Math.ceil(this.plotHeight * aspectRatio);
                        this.maxImageContainerWidthOverylay = Math.max(this.imageAdjustedWidth, (this.plotWidth + this.widthAdjustment))
                        this.maxImageContainerWidthSidebySide = Math.max((this.plotWidth + this.widthAdjustment) * 2, (this.plotWidth + this.widthAdjustment + this.imageAdjustedWidth))

                        this.droppedFileURL = reader.result as string;
                    };
                    image.src = event.target?.result as string;
                };
                reader.readAsDataURL(this.droppedFile);
            }
        }
    }

    isImageType(fileType: string): boolean {
        return fileType.startsWith('image/');
    }

    onFileSelected(event: any): void {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.droppedFile = fileList[0];
            this.displayFile();
        }
    }

    applyZoom(type) {
        if (type === '-' && this.currentZoomScaleFactor === 1) {
            this.currentZoomScaleFactor = 0.5;
        } else if (type === '+' && this.currentZoomScaleFactor === 0.5) {
            this.currentZoomScaleFactor = 1
        } else if (type === '+') {
            this.currentZoomScaleFactor += 1
        } else if (type === '-') {
            this.currentZoomScaleFactor -= 1
        }
        const plotContainer = document.querySelector('.plotContainer') as HTMLImageElement;
        const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
        const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;

        const miniMapContainer = document.querySelector('.miniMapContainer') as HTMLImageElement;
        const miniSubContainer = document.querySelector('.miniSubContainer') as HTMLImageElement;
        const minimapImageContainer = document.querySelector('.miniMapImageContainer') as HTMLImageElement;
        const minimapPlotContainer = document.querySelector('.minimapPlotContainer') as HTMLImageElement;

        const miniBoxContainer = document.querySelector('.miniboxDiv') as HTMLImageElement;

        this.sliderLeft = 0;
        this.sliderTop = 0;

        if (this.currentZoomScaleFactor === 1) {
            this.legendWidth = 120
        } else {
            this.legendWidth = 0
        }

        if (plotContainer || imageContainer) {
            const transformPlotValue = `translateX(${-this.currentLeft * this.currentZoomScaleFactor + this.sliderLeft}px) translateY(${this.currentTop * this.currentZoomScaleFactor + this.sliderTop}px) scaleX(${this.currentZoomScaleFactor}) scaleY(${this.currentZoomScaleFactor})`;
            const transformImageValue = `translateX(${-this.currentImageLeft * this.currentZoomScaleFactor + this.sliderLeft}px) translateY(${this.currentImageTop * this.currentZoomScaleFactor + this.sliderTop}px) scaleX(${this.currentZoomScaleFactor * this.flipX}) scaleY(${this.currentZoomScaleFactor * this.flipY}) rotate(${this.currentDegree}deg)`;

            plotContainer.style.transform = transformPlotValue;
            imageContainer.style.transform = transformImageValue;
            imageContainer2.style.transform = transformImageValue;

            const minimapPlotTransformValue = `translateX(${-(this.currentLeft * this.currentZoomScaleFactor + this.sliderLeft) / 4}px) translateY(${(this.currentTop * this.currentZoomScaleFactor + this.sliderTop) / 4}px) scaleX(${this.currentZoomScaleFactor}) scaleY(${this.currentZoomScaleFactor})`;
            const minimapImageTransformValue = `translateX(${-(this.currentImageLeft * this.currentZoomScaleFactor + this.sliderLeft) / 4}px) translateY(${(this.currentImageTop * this.currentZoomScaleFactor + this.sliderTop) / 4}px) scaleX(${this.currentZoomScaleFactor * this.flipX}) scaleY(${this.currentZoomScaleFactor * this.flipY}) rotate(${this.currentDegree}deg)`;

            minimapImageContainer.style.transform = minimapImageTransformValue;
            minimapPlotContainer.style.transform = minimapPlotTransformValue;

            const transformMiniMapValue = `scaleX(${1 / this.currentZoomScaleFactor}) scaleY(${1 / this.currentZoomScaleFactor})`;
            miniMapContainer.style.transform = transformMiniMapValue
        }

        let selectionRectWidth = this.originalPlotWidth / (4 * this.currentZoomScaleFactor);
        let selectionRectHeight = this.originalPlotHeight / (4 * this.currentZoomScaleFactor);

        this.selectionRectStyle = {
            top: `${0}px`,
            width: `${selectionRectWidth}px`,
            height: `${selectionRectHeight}px`,
            border: '2px solid #1DA1F2',
            position: 'absolute',
        };

        let centerAdjustmentWidth = this.currentZoomScaleFactor === 1 ? 0 : selectionRectWidth / 2;
        let centerAdjustmentHeight = this.currentZoomScaleFactor === 1 ? 0 : selectionRectHeight / 2;
        let transformBox = `translateX(${this.currentZoomScaleFactor === 0.5 ? -40 : this.currentLeft + centerAdjustmentWidth}px) translateY(${this.currentZoomScaleFactor === 0.5 ? -50 : this.currentTop + centerAdjustmentHeight}px) scaleX(${this.currentZoomScaleFactor}) scaleY(${this.currentZoomScaleFactor})`;

        miniBoxContainer.style.transform = transformBox;
        miniSubContainer.style.transform = `scale(${this.currentZoomScaleFactor === 0.5 ? 0.5 : 1})`;

        this.createScatterplotWithPieCharts('normal')
        this.createScatterplotWithPieCharts('minimap')


    }
}