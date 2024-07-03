import { Component, ChangeDetectionStrategy, Input, EventEmitter, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { NotificationService } from '@core/core.module';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';

interface ScatterDataNormailization {
  xValue: number;
  yValue: number;
  totalCounts: number;
}
interface ScatterDataCluster {
  xValue: number;
  yValue: number;
  clusterid: string
}

@Component({
  selector: 'mev-base-spatialge',
  templateUrl: './base-spatialge.component.html',
  styleUrls: ['./base-spatialge.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class BaseSpatialgeComponent {
  @Input() outputs;
  @ViewChild('canvasElement1') canvasElement1: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasElement2') canvasElement2: ElementRef<HTMLCanvasElement>;

  protected readonly API_URL = environment.apiUrl;
  onActionSpotlight = new EventEmitter<void>();

  containerId: string = '#scatter';
  minimapContainerId: string = '#minimapId';
  operationName: string = '';

  isLoading: boolean = false;
  displayOverlayContainer: boolean = true;

  scatterPlotData: ScatterDataNormailization[] = [];
  scatterPlotDataCluster: ScatterDataCluster[] = [];

  dataDict: Record<string, any> = {}

  xMin: number = 100000000
  xMax: number = 0
  yMin: number = 100000000
  yMax: number = 0
  totalCountsMax: number = 0;
  totalCountsMin: number = 100000000;

  totalCounts: Record<string, any> = {}

  plotWidth: number = 300;
  plotHeight: number = 500;
  originalPlotWidth: number = 0;
  originalPlotHeight: number = 0;
  legendWidth: number = 120;

  xAxisValue: string = '';
  yAxisValue: string = ''
  xAxisValueList: string[] = [];
  yAxisValueList: string[] = [];

  widthAdjustment: number = 0;
  heightAdjustment: number = 0;

  imageAdjustedWidth: number = 600;
  maxImageContainerWidthOverylay: number = this.plotWidth;
  maxImageContainerWidthSidebySide: number = this.plotWidth * 2;

  // geneSearch: string = 'VIM';
  geneSearch: string = 'ENSMUSG00000025903';
  geneSearchVal: string = 'ENSMUSG00000025903';
  geneSearchHeight: number = 100;

  panelOpenState: boolean = true;

  scaleFactor: number;
  scaleFactorVal = '';

  overlayImage: boolean = false;
  displayPlot: boolean = false;
  displayImage: boolean = false;
  displayAlignment: boolean = false;

  currentZoomVal: number = 1;

  plotOpacityValue: number = .7
  imageOpacityValue: number = .5

  selectedColor: string = 'Green';
  colors: string[] = ['Red', 'Green'];

  clusterTypes: Record<string, any> = {};
  clusterColors: string[] = ["#EBCD00", "#52A52E", "#00979D", "#6578B4", "#80408D", "#C9006B", "#68666F", "#E80538", "#E87D1E"];

  moveAmount: number = 5;
  moveAmountVal: string = '5';

  droppedFile: File | null = null;
  droppedFileURL: string | ArrayBuffer | null = null;

  useCluster: boolean = false;
  useNormalization: boolean = false;

  selectionRectStyle: Record<string, any> = {
    top: '',
    left: '',
    width: '',
    height: '',
    border: '',
    position: '',
  };

  analysisType: string = ''


  //separate the alignment variables here

  currentDegree: number = 0;
  scaleXCustom: number = 1;

  showMiniMap = false;

  zoomMin: number = 0.5;
  zoomMax: number = 5;

  currentImageLeft: number = 0;
  currentImageTop: number = 0;
  sliderLeft: number = 0;
  sliderTop: number = 0;

  xAxisFlipped: boolean = false;
  yAxisFlipped: boolean = false;
  axisSwapped: boolean = false;

  flipX = 1;
  flipY = 1;

  hideMinimapImage = false;

  normalizePlotWidth = 400;
  imageOverlayOffset = 220;

  aspectRatio = 1;
  reloadImage = false;
  croppedWidth = this.imageAdjustedWidth;
  croppedHeight = this.plotHeight * 1.5;

  imageWidth = 0;
  imageHeight = 0;

  constructor(
    protected httpClient: HttpClient,
    protected readonly notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    public route: ActivatedRoute,
    public apiService: AnalysesService,
    public analysesService: AnalysesService,
  ) { }

  resetAllVariables() {
    this.scatterPlotData = [];
    this.scatterPlotDataCluster = [];
    this.xMin = 100000000
    this.xMax = 0
    this.yMin = 100000000
    this.yMax = 0
    this.totalCountsMax = 0;
    this.totalCountsMin = 100000000;

    this.dataDict = {}
    this.plotWidth = 300;
    this.plotHeight = 500;
    this.originalPlotWidth = 0;
    this.originalPlotHeight = 0;

    this.currentZoomVal = 1;
    this.scaleXCustom = 1;

    this.currentImageLeft = 0
    this.currentImageTop = 0
    this.sliderLeft = 0
    this.sliderTop = 0

    this.overlayImage = false;
    this.displayAlignment = false;
    this.axisSwapped = false
    this.xAxisFlipped = false;
    this.yAxisFlipped = false;
    this.showMiniMap = false;

    this.legendWidth = 120;
    this.flipX = 1;
    this.flipY = 1;
    this.currentDegree = 0;
    this.moveAmount = 5;
    this.moveAmountVal = '5';
    this.widthAdjustment = 0;
    this.heightAdjustment = 0;

    this.droppedFile = null;
    this.droppedFileURL = null;
    this.scaleFactorVal = '';
    this.scaleFactor = null;

    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;
    const plotContainer = document.querySelector('.plotContainer') as HTMLImageElement;

    const miniBoxContainer = document.querySelector('.miniboxDiv') as HTMLImageElement;
    const minimapPlotContainer = document.querySelector('.minimapPlotContainer') as HTMLImageElement;

    let transformImageValue = `translateX(${0}px) translateY(${0}px) scaleX(${1}) scaleY(${1}) rotate(${0}deg)`;
    let transformMiniMapValue = `translateX(${0}px) translateY(${0}px) scaleX(${1}) scaleY(${1}) rotate(${0}deg)`;
    let transformBox = `translateX(${0}px) translateY(${0}px) scaleX(${1}) scaleY(${1})`;

    if (imageContainer) {
      imageContainer.style.transform = transformImageValue;
      imageContainer2.style.transform = transformImageValue;
    }

    if (plotContainer) {
      plotContainer.style.transform = transformImageValue;
    }

    if (minimapPlotContainer) {
      miniBoxContainer.style.transform = transformBox;
      minimapPlotContainer.style.transform = transformMiniMapValue;
    }
  }

  resetImageVariables() {
    this.widthAdjustment = 0;
    this.heightAdjustment = 0;
    this.currentImageLeft = 0;
    this.currentImageTop = 0;
    this.flipX = 1;
    this.flipY = 1;
    this.currentDegree = 0;
    this.currentZoomVal = 1;

    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;
    let transformImageValue = `translateX(${0}px) translateY(${0}px) scaleX(${1}) scaleY(${1}) rotate(${0}deg)`;
    imageContainer.style.transform = transformImageValue;
    imageContainer2.style.transform = transformImageValue;
  }

  getAxisColumnNames() {
    this.isLoading = true;
    let coords_metadata_uuid = this.outputs["coords_metadata"]
    this.httpClient.get(`${this.API_URL}/resources/${coords_metadata_uuid}/contents/?page=1&page_size=1`).pipe(
      catchError(error => {
        this.isLoading = false;
        this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
        console.log("some error from coord: ", error)
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

  // normalization_uuid = '';
  // coords_metadata_uuid = '';
  getDataNormalization() {
    this.displayOverlayContainer = true;
    this.showMiniMap = true;
    this.geneSearch = this.geneSearchVal.split('').map(letter => letter.toUpperCase()).join('');
    this.geneSearchHeight = 100;
    this.useNormalization = true;
    this.useCluster = false;
    this.isLoading = true;
    this.panelOpenState = false;
    this.scrollTo('topOfPage');
    this.resetAllVariables();

    let normalization_uuid = this.outputs["normalized_expression"];
    let coords_metadata_uuid = this.outputs["coords_metadata"];
    let normUrl = `${this.API_URL}/resources/${normalization_uuid}/contents/?__rowname__=[eq]:${this.geneSearch}`;

    const normRequest = this.httpClient.get(normUrl).pipe(
      catchError(error => {
        this.isLoading = false;
        this.notificationService.error(`Error ${error.status}: Error from normalized expression request.`);
        console.log("some error message from norm: ", error)
        throw error;
      })
    );

    let coordMetaUrl = `${this.API_URL}/resources/${coords_metadata_uuid}/contents/`;
    const coordsMetadataRequest = this.httpClient.get(coordMetaUrl).pipe(
      catchError(error => {
        this.isLoading = false;
        this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
        console.log("some error from coord: ", error)
        throw error;
      })
    );

    forkJoin([normRequest, coordsMetadataRequest]).subscribe(([normRes, coordsMetadataRes]) => {
      this.isLoading = false;
      if (Array.isArray(normRes) && normRes.length > 0 && normRes[0].hasOwnProperty('values')) {
        for (let i in normRes[0]['values']) {
          let key = i;
          let count = normRes[0]['values'][i];
          this.dataDict[key] = {
            ...this.dataDict[key],
            count
          };
        }

        for (let i in coordsMetadataRes) {
          let obj = coordsMetadataRes[i];
          let key = obj['rowname'];
          let xVal = obj['values'][this.xAxisValue];
          let yVal = obj['values'][this.yAxisValue];

          this.dataDict[key] = {
            ...this.dataDict[key],
            xVal,
            yVal
          };
        }

        for (let i in this.dataDict) {
          const parsedX = parseInt(this.dataDict[i]['xVal'])
          const parsedY = parseInt(this.dataDict[i]['yVal'])
          const totalCounts = parseFloat(parseFloat(this.dataDict[i]['count']).toFixed(3));

          if (this.dataDict[i]['xVal'] !== undefined && this.dataDict[i]['yVal'] !== undefined && this.dataDict[i]['count'] !== undefined && !isNaN(parsedX) && !isNaN(parsedY) && !isNaN(totalCounts)) {
            let temp = {
              "xValue": parsedX,
              "yValue": parsedY,
              "totalCounts": totalCounts
            }
            let keyName = parsedX + "_" + parsedY
            this.totalCounts[keyName] = totalCounts
            this.scatterPlotData.push(temp)

            this.xMin = Math.min(this.xMin, parsedX);
            this.xMax = Math.max(this.xMax, parsedX);

            this.yMin = Math.min(this.yMin, parsedY);
            this.yMax = Math.max(this.yMax, parsedY);

            this.totalCountsMax = Math.max(this.totalCountsMax, totalCounts)
            this.totalCountsMin = Math.min(this.totalCountsMin, totalCounts)
          }
        }
        // let normalizePlot = (this.xMax - this.xMin) > (this.yMax - this.yMin) ? (this.xMax - this.xMin) / this.normalizePlotWidth : (this.yMax - this.yMin) / this.normalizePlotWidth

        let normalizePlot = (this.xMax - this.xMin) / this.normalizePlotWidth // This will set the plot to a width of 300px
        this.plotWidth = (this.xMax - this.xMin) / normalizePlot;
        this.plotHeight = (this.yMax - this.yMin) / normalizePlot;

        this.imageOverlayOffset = this.plotWidth - this.legendWidth

        if (this.originalPlotWidth === 0) {
          this.originalPlotWidth = this.plotWidth;
          this.originalPlotHeight = this.plotHeight;
        }

        let selectionRectWidth = this.plotWidth / (4 * this.currentZoomVal);
        let selectionRectHeight = this.plotHeight / (4 * this.currentZoomVal);

        this.selectionRectStyle = {
          top: `-${0}px`,
          left: `-${0}px`,
          width: `${selectionRectWidth}px`,
          height: `${selectionRectHeight}px`,
          border: '2px solid #1DA1F2',
          position: 'absolute',
        };

        if (this.scatterPlotData.length > 0) {
          this.displayOverlayContainer = true;
          this.callCreateScatterPlot();
        }

      }

      else {
        this.displayOverlayContainer = false;
      }
    });
  }

  getDataClusters() {
    this.showMiniMap = true;
    this.geneSearchHeight = 0;
    this.useCluster = true;
    this.isLoading = true;
    this.panelOpenState = false;
    this.scrollTo('topOfPage')
    this.resetAllVariables();
    let clusters_uuid = this.outputs["clustered_positions"];
    let coords_metadata_uuid = this.outputs["coords_metadata"]

    const clusterRequest = this.httpClient.get(`${this.API_URL}/resources/${clusters_uuid}/contents/`).pipe(
      catchError(error => {
        this.isLoading = false;
        this.notificationService.error(`Error ${error.status}: Error from normalized expression request.`);
        throw error;
      })
    );

    const coordsMetadataRequest = this.httpClient.get(`${this.API_URL}/resources/${coords_metadata_uuid}/contents/`).pipe(
      catchError(error => {
        this.isLoading = false;
        this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
        throw error;
      })
    );

    forkJoin([clusterRequest, coordsMetadataRequest]).subscribe(([clusterRes, coordsMetadataRes]) => {
      this.isLoading = false;
      if (Array.isArray(clusterRes) && clusterRes.length > 0 && clusterRes[0].hasOwnProperty('rowname') && clusterRes[0].hasOwnProperty('values')) {
        for (let index in clusterRes) {
          let key = clusterRes[index]['rowname']
          let clusterid = clusterRes[index]['values']['clusterid']
          this.dataDict[key] = {
            ...this.dataDict[key],
            clusterid
          };
        }

        for (let i in coordsMetadataRes) {
          let obj = coordsMetadataRes[i];
          let key = obj['rowname'];
          let xVal = obj['values'][this.xAxisValue]
          let yVal = obj['values'][this.yAxisValue]
          this.dataDict[key] = {
            ...this.dataDict[key],
            xVal,
            yVal
          };
        }

        let colorLabels = {}

        for (let i in this.dataDict) {
          const parsedX = parseInt(this.dataDict[i]['xVal'])
          const parsedY = parseInt(this.dataDict[i]['yVal'])
          const clusterid = this.dataDict[i]['clusterid']

          if (!isNaN(parsedX) && !isNaN(parsedY) && clusterid) {
            let clusterName = "Cluster " + clusterid
            let temp = {
              "xValue": parsedX,
              "yValue": parsedY,
              "clusterid": clusterid
            }
            //this allows for the colors to be repeated 
            let clusterNumber = parseInt(clusterid)
            if (!colorLabels[clusterNumber]) {
              colorLabels[clusterNumber] = 1;
              let remainder = clusterNumber % this.clusterColors.length;
              let colorObj = {
                "label": clusterName,
                "color": remainder === 0 ? this.clusterColors[this.clusterColors.length - 1] : this.clusterColors[remainder - 1]
              }
              this.clusterTypes[clusterName] = colorObj
            }

            this.scatterPlotDataCluster.push(temp)

            this.xMin = Math.min(this.xMin, parsedX);
            this.xMax = Math.max(this.xMax, parsedX);

            this.yMin = Math.min(this.yMin, parsedY);
            this.yMax = Math.max(this.yMax, parsedY);
          }
        }

        // let normalizePlot = (this.xMax - this.xMin) > (this.yMax - this.yMin) ? (this.xMax - this.xMin) / this.normalizePlotWidth : (this.yMax - this.yMin) / this.normalizePlotWidth
        let normalizePlot = (this.xMax - this.xMin) / this.normalizePlotWidth // This will set the plot to a width of 300px
        this.plotWidth = (this.xMax - this.xMin) / normalizePlot;
        this.plotHeight = (this.yMax - this.yMin) / normalizePlot;

        this.imageOverlayOffset = this.plotWidth - this.legendWidth

        if (this.originalPlotWidth === 0) {
          this.originalPlotWidth = this.plotWidth;
          this.originalPlotHeight = this.plotHeight;
        }

        let selectionRectWidth = this.plotWidth / (4 * this.currentZoomVal);
        let selectionRectHeight = this.plotHeight / (4 * this.currentZoomVal);

        this.selectionRectStyle = {
          top: `-${0}px`,
          left: `-${0}px`,
          width: `${selectionRectWidth}px`,
          height: `${selectionRectHeight}px`,
          border: '2px solid #1DA1F2',
          position: 'absolute',
        };

        if (this.scatterPlotDataCluster.length > 0) {
          this.displayOverlayContainer = true;
          this.callCreateScatterPlot();
        }
      } else {
        this.displayOverlayContainer = false;
      }

    });
  }

  createScatterPlot(size) {
    this.displayPlot = true;
    var margin = { top: 0, right: 0, bottom: 0, left: size === 'normal' ? this.legendWidth : 0 },
      width = size === 'normal' ? this.plotWidth - margin.left - margin.right + this.legendWidth : (this.plotWidth - margin.left - margin.right) / 4,
      height = size === 'normal' ? this.plotHeight - margin.top - margin.bottom : (this.plotHeight - margin.top - margin.bottom) / 4;

    let scatterplotContainerId = size === 'normal' ? this.containerId : this.minimapContainerId;
    d3.select(scatterplotContainerId)
      .selectAll('svg')
      .remove();

    const pointTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event: any, d: any) => {
        let tipBox = this.useNormalization ? `<div><div class="category">Normalized Count:</div> ${d.totalCounts}</div>` : `<div><div class="category">Cluster ID:</div> ${d.clusterid}</div>`
        return tipBox
      });

    var svg = d3.select(scatterplotContainerId)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      // .style("background", "pink")
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    svg.call(pointTip);

    const color = d3.scaleLinear<string>()
      .domain([0, this.totalCountsMax])
      .range(["rgb(255,255,224)", this.selectedColor]);

    const colorScale = d3.scaleOrdinal<string>()
      .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
      .range(this.clusterColors);

    var x = d3.scaleLinear()
      .domain([this.xMin, this.xMax])
      .range([0, width]);

    var y = d3.scaleLinear()
      .domain([this.yMin, this.yMax])
      .range([height, 0]);

    let useNorm = this.useNormalization

    const circles = svg.append('g')
      .selectAll("dot")
      .data(useNorm ? this.scatterPlotData : this.scatterPlotDataCluster)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return x(d.xValue) })
      .attr("cy", function (d) { return height - y(d.yValue); })
      .attr("r", size === 'normal' ? 1.75 : .5)
      .attr("fill", d => {
        return useNorm ? color(d.totalCounts) : colorScale(d.clusterid)
      })


    if (size === 'normal') {
      circles.on('mouseover', function (mouseEvent: any, d) {
        d3.select(this).style('cursor', 'pointer');
        pointTip.show(mouseEvent, d, this);
        pointTip.style('left', mouseEvent.x + 10 + 'px');
      })
        .on('mouseout', function () {
          d3.select(this).style('cursor', 'default');  // Revert cursor to default on mouseout
          pointTip.hide();
        });
    }

    // Add Legend
    if (this.legendWidth !== 0 && size !== 'minimap') {
      if (useNorm) {
        const gradient = svg.append("defs")
          .append("linearGradient")
          .attr("id", "legendGradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%");

        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "white");

        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", this.selectedColor);

        const legendX = -this.legendWidth + 20;
        const legendY = 60;
        const borderWidth = 1;
        const legendBarWidth = 50;
        const legendBarHeight = 10;

        svg.append("rect")
          .attr("x", legendX - borderWidth)
          .attr("y", legendY - borderWidth)
          .attr("width", legendBarWidth + 2 * borderWidth)
          .attr("height", legendBarHeight + 2 * borderWidth)
          .style("stroke", "rgba(0, 0, 0, 0.3)")
          .style("fill", "none");

        // Create legend rectangle
        svg.append("rect")
          .attr("x", legendX)
          .attr("y", legendY)
          .attr("width", legendBarWidth)
          .attr("height", legendBarHeight)
          .style("fill", "url(#legendGradient)")

        svg.append("text")
          .attr("x", legendX)
          .attr("y", 80)
          .attr("text-anchor", "start")
          .attr("font-size", "6px")
          .text("0");

        const xmaxLabelWidth = this.totalCountsMax.toString().toLocaleString().length * 1;  // Adjust the font size multiplier as needed
        const adjustedXmaxLabelX = legendX + 60 - xmaxLabelWidth;

        svg.append("text")
          .attr("x", adjustedXmaxLabelX)
          .attr("y", 80)
          .attr("text-anchor", "end")
          .attr("font-size", "6px")
          .text(this.totalCountsMax.toLocaleString());

        svg.append("text")
          .attr("x", legendX)
          .attr("y", 50)
          .attr("text-anchor", "start")
          .attr("font-size", "6px")
          .attr("font-weight", "bold")
          .text("Counts");
      } else if (this.useCluster) {
        // Legend
        const clusterColors = Object.keys(this.clusterTypes).map(key => ({
          label: this.clusterTypes[key].label,
          color: this.clusterTypes[key].color
        }));
        clusterColors.sort((a, b) => {
          const numA = parseInt(a.label.split(' ')[1]);
          const numB = parseInt(b.label.split(' ')[1]);
          return numA - numB;
        });
        const legendWidth = this.legendWidth;

        const legend = svg
          .selectAll('.legend')
          .data(clusterColors)
          .enter()
          .append('g')
          .classed('legend', true)
          .attr('transform', function (d, i) {
            return `translate(-${legendWidth},${i * 15 + 50})`;
          });

        legend
          .append('circle')
          .attr('r', 4)
          .attr('cx', 10)
          .attr('fill', d => d.color);

        legend
          .append('text')
          .attr('x', 20)
          .attr('dy', '.35em')
          .style('fill', '#000')
          .style('font-size', '8px')
          .attr('class', 'legend-label')
          .text(d => d.label);
      }
    }

  }

  scrollTo(htmlID) {
    const element = document.getElementById(htmlID) as HTMLElement;
    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }

  //These functions are for Downloading the plots and images
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
    }, 500);

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
            this.imageWidth = image.width
            this.imageHeight = image.height
            const aspectRatio = image.width / image.height;
            this.imageAdjustedWidth = Math.ceil(this.plotHeight * aspectRatio);
            this.maxImageContainerWidthOverylay = Math.max(this.imageAdjustedWidth, this.plotWidth);
            this.maxImageContainerWidthSidebySide = Math.max(this.plotWidth * 2, (this.plotWidth + this.imageAdjustedWidth));

            this.droppedFileURL = reader.result as string;
            this.loadImageAndCrop(image);  // Call the cropping function with the loaded image
            this.cdr.detectChanges();

          };
          image.src = event.target?.result as string;
        };
        reader.readAsDataURL(this.droppedFile);
      }
    }
  }

  loadImageAndCrop(image: HTMLImageElement) {
    this.isLoading = false;
    const canvas1 = this.canvasElement1.nativeElement;
    const canvas2 = this.canvasElement2.nativeElement;
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    if (this.scaleFactorVal === '') {
      ctx1.clearRect(0, 0, canvas2.width, canvas2.height);
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

      this.aspectRatio = image.width / image.height;
      let imageAdjustedWidth = Math.ceil(this.plotHeight * this.aspectRatio);

      ctx1.drawImage(image, 0, 0, imageAdjustedWidth, this.plotHeight);
      ctx2.drawImage(image, 0, 0, imageAdjustedWidth, this.plotHeight);

      if (!this.reloadImage) {
        this.reloadImage = true;
        this.displayFile()
      }
    } else {
      const cropX = this.xMin * this.scaleFactor; // X coordinate of the top-left corner of the cropping rectangle
      const cropY = this.yMin * this.scaleFactor; // Y coordinate of the top-left corner of the cropping rectangle
      const cropWidth = (this.xMax - this.xMin) * this.scaleFactor; // Width of the cropping rectangle
      const cropHeight = (this.yMax - this.yMin) * this.scaleFactor; // Height of the cropping rectangle

      this.croppedWidth = cropWidth;
      this.croppedHeight = cropHeight;

      this.aspectRatio = cropWidth / cropHeight
      let imageAdjustedWidth = this.plotHeight * this.aspectRatio;
      ctx1.clearRect(0, 0, canvas1.width, canvas1.height); // Clear the canvas
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

      ctx1.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, imageAdjustedWidth, this.plotHeight);
      ctx2.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, imageAdjustedWidth, this.plotHeight);
    }


    //image isn't displayed on the canvas on the first try. fix this tomorrow.
    //add change in SCALEFACTOR will allow reload of image
    if (!this.reloadImage) {
      this.reloadImage = true;
      this.displayFile()
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

  callCreateScatterPlot() {
    if (this.operationName === 'SPOTlight') {
      this.onActionSpotlight.emit();
    } else {
      this.createScatterPlot('normal')
      this.createScatterPlot('minimap')
    }
  }

  updatePlotOpacity(value: number): void {
    this.plotOpacityValue = value;
  }

  updateImageOpacity(value: number): void {
    this.imageOpacityValue = value;
  }

  setScaleFactor(event: Event) {
    event.preventDefault();

    this.resetImageVariables()

    if (this.scaleFactorVal !== '') {
      this.scaleFactor = parseFloat(this.scaleFactorVal)
      this.notificationService.success(`Scale Factor updated to ${this.scaleFactor}.`);
      this.reloadImage = false;
      this.displayFile();
    }

  }

  onColorChange() {
    this.callCreateScatterPlot();
  }

  setMoveAmount(event: Event) {
    event.preventDefault();
    this.moveAmount = parseFloat(this.moveAmountVal)
    this.notificationService.success(`Alignment step size updated to ${this.moveAmount}.`);
    this.callCreateScatterPlot();
  }

  applyZoom(type) {
    if (type === '-' && this.currentZoomVal === 1) {
      this.currentZoomVal = 0.5;
    } else if (type === '+' && this.currentZoomVal === 0.5) {
      this.currentZoomVal = 1
    } else if (type === '+') {
      this.currentZoomVal += 1
    } else if (type === '-') {
      this.currentZoomVal -= 1
    }
    const plotContainer = document.querySelector('.plotContainer') as HTMLImageElement;
    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;

    const miniMapContainer = document.querySelector('.miniMapContainer') as HTMLImageElement;
    const miniSubContainer = document.querySelector('.miniSubContainer') as HTMLImageElement;
    const minimapPlotContainer = document.querySelector('.minimapPlotContainer') as HTMLImageElement;

    const miniBoxContainer = document.querySelector('.miniboxDiv') as HTMLImageElement;

    this.sliderLeft = 0;
    this.sliderTop = 0;

    if (this.currentZoomVal === 1 && !this.displayAlignment) {
      this.legendWidth = 120;
    } else {
      this.legendWidth = 0
    }


    if (plotContainer || imageContainer) {
      const transformPlotValue = `translateX(${-(this.sliderLeft)}px) translateY(${this.sliderTop}px) scaleX(${this.currentZoomVal}) scaleY(${this.currentZoomVal})`;
      const transformImageValue = `translateX(${-(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
      const transformImageValue2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;

      plotContainer.style.transform = transformPlotValue;
      imageContainer.style.transform = transformImageValue;
      imageContainer2.style.transform = transformImageValue2;

      const minimapPlotTransformValue = `translateX(${-(this.sliderLeft) / 4}px) translateY(${(this.sliderTop) / 4}px) scaleX(${this.currentZoomVal}) scaleY(${this.currentZoomVal})`;

      minimapPlotContainer.style.transform = minimapPlotTransformValue;

      const transformMiniMapValue = `scaleX(${1 / this.currentZoomVal}) scaleY(${1 / this.currentZoomVal})`;
      miniMapContainer.style.transform = transformMiniMapValue


    }

    let selectionRectWidth = this.plotWidth / (4 * this.currentZoomVal);
    let selectionRectHeight = this.plotHeight / (4 * this.currentZoomVal);

    this.selectionRectStyle = {
      top: `-${0}px`,
      left: `-${0}px`,
      width: `${selectionRectWidth}px`,
      height: `${selectionRectHeight}px`,
      border: '2px solid #1DA1F2',
      position: 'absolute',
    };

    let centerAdjustmentWidth = this.currentZoomVal === 1 ? 0 : selectionRectWidth / 2;
    let centerAdjustmentHeight = this.currentZoomVal === 1 ? 0 : selectionRectHeight / 2;
    let transformBox = `translateX(${this.currentZoomVal === 0.5 ? -40 : centerAdjustmentWidth}px) translateY(${this.currentZoomVal === 0.5 ? -50 : centerAdjustmentHeight}px) scaleX(${this.currentZoomVal}) scaleY(${this.currentZoomVal})`;

    miniBoxContainer.style.transform = transformBox;
    miniSubContainer.style.transform = `scale(${this.currentZoomVal === 0.5 ? 0.5 : 1})`;

    this.callCreateScatterPlot();

  }

  //Alignment functions
  // setAlignmentMode() {
  //   this.changeOverlayMode();
  // }

  moveImage(direction, mode, container) {
    const plotContainer = document.querySelector('.plotContainer') as HTMLImageElement;
    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;

    const miniBoxContainer = document.querySelector('.miniboxDiv') as HTMLImageElement;
    const minimapPlotContainer = document.querySelector('.minimapPlotContainer') as HTMLImageElement;

    let transformPlotValue;
    let transformBox;
    let transformImageValue;
    let transformImageValue2;
    let transformPlotMiniMapValue;

    if (mode === 'align' && container === 'image') {
      switch (direction) {
        case 'left':
          this.currentImageLeft += this.moveAmount / (this.currentZoomVal + 1);
          break;
        case 'right':
          this.currentImageLeft -= this.moveAmount / (this.currentZoomVal + 1);
          break;
        case 'up':
          this.currentImageTop -= this.moveAmount / (this.currentZoomVal + 1);
          break;
        case 'down':
          this.currentImageTop += this.moveAmount / (this.currentZoomVal + 1);
          break;
        default:
          break;
      }
    }

    transformPlotValue = `translateX(${-(this.sliderLeft)}px) translateY(${this.sliderTop}px) scaleX(${this.currentZoomVal}) scaleY(${this.currentZoomVal})`;
    transformImageValue = `translateX(${-(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    transformImageValue2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;


    transformPlotMiniMapValue = `translateX(${0}px) translateY(${0}px) scaleX(${this.currentZoomVal}) scaleY(${this.currentZoomVal})`;
    transformBox = `translateX(${0}px) translateY(${0}}px) scaleX(${this.currentZoomVal}) scaleY(${this.currentZoomVal})`;

    if (mode === 'align' || mode === 'zoom' || mode === 'slider') {
      plotContainer.style.transform = transformPlotValue;
      imageContainer.style.transform = transformImageValue;
      imageContainer2.style.transform = transformImageValue2;
      minimapPlotContainer.style.transform = transformPlotMiniMapValue;
      miniBoxContainer.style.transform = transformBox;
    }

    let selectionRectWidth = this.plotWidth / (4 * this.currentZoomVal);
    let selectionRectHeight = this.plotHeight / (4 * this.currentZoomVal);

    this.selectionRectStyle = {
      top: `${-(this.sliderTop - selectionRectHeight / 2) / 4}px`,
      left: `${(this.sliderLeft - selectionRectWidth / 2) / 4}px`,
      width: `${selectionRectWidth}px`,
      height: `${selectionRectHeight}px`,
      border: '2px solid #1DA1F2',
      position: 'absolute',
    };

  }

  stretchPlot(axis, direction) {
    if (axis === 'x-axis' && direction === '+') {
      this.widthAdjustment += this.moveAmount;
    } else if (axis === 'x-axis' && direction === '-') {
      this.widthAdjustment -= this.moveAmount;
    } else if (axis === 'y-axis' && direction === '+') {
      this.heightAdjustment += this.moveAmount;
    } else if (axis === 'y-axis' && direction === '-') {
      this.heightAdjustment -= this.moveAmount;
    }

    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;

    let transformImageValue = `translateX(${-(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px)  scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    let transformImageValue2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px)  scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;

    imageContainer.style.transform = transformImageValue;
    imageContainer2.style.transform = transformImageValue2;
  }

  setZoomMode() {
    this.callCreateScatterPlot();
  }

  minSliderLeftValue(): number {
    let selectionRectWidth = this.plotWidth / (4 * this.currentZoomVal);
    return -this.plotWidth * (this.currentZoomVal) / 2 - selectionRectWidth / 2;
  }

  maxSliderLeftValue(): number {
    let selectionRectWidth = this.plotWidth / (4 * this.currentZoomVal);
    return this.plotWidth * (this.currentZoomVal) / 2 + selectionRectWidth / 2;
  }

  minSliderTopValue(): number {
    let selectionRectHeight = this.plotHeight / (4 * this.currentZoomVal);
    return -this.plotHeight * (this.currentZoomVal) / 2 - selectionRectHeight / 2;
  }

  maxSliderTopValue(): number {
    let selectionRectHeight = this.plotHeight / (4 * this.currentZoomVal);
    return this.plotHeight * (this.currentZoomVal) / 2 + selectionRectHeight / 2;
  }

  rotateImage(direction) {
    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;

    const increment = this.axisSwapped ? -1 : 1;

    if (direction === "+") {
      this.currentDegree += increment;
    } else {
      this.currentDegree -= increment;
    }

    let transformImageValue = `translateX(${-(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    let transformImageValue2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;


    imageContainer.style.transform = transformImageValue;
    imageContainer2.style.transform = transformImageValue2;
  }

  swapAxis() {
    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;

    this.axisSwapped = !this.axisSwapped;
    if (this.axisSwapped === false) {
      this.currentDegree -= 90
    } else {
      this.currentDegree += 90
    }

    this.scaleXCustom *= -1
    // translateX(${this.flipX === 1 ? -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft) : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft) + this.originalLegendWidth * this.currentZoomVal}px)
    let transformImageValue = `translateX(${-(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px)  scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    let transformImageValue2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px)  scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;

    imageContainer.style.transform = transformImageValue;
    imageContainer2.style.transform = transformImageValue2;
  }

  flipAxis(axis) {
    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;

    if (axis === 'horizontal') {
      this.xAxisFlipped = !this.xAxisFlipped;
      this.flipX = this.xAxisFlipped ? -1 : 1;
    } else {
      this.yAxisFlipped = !this.yAxisFlipped;
      this.flipY = this.yAxisFlipped ? -1 : 1;
    }

    let verticalImageTransform = `translateX(${-(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    let horizontalImageTransform = `translateX(${-(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    let transformImageValue = axis === 'vertical' ? verticalImageTransform : horizontalImageTransform;

    let verticalImageTransform2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    let horizontalImageTransform2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px) scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    let transformImageValue2 = axis === 'vertical' ? verticalImageTransform2 : horizontalImageTransform2;

    imageContainer.style.transform = transformImageValue;
    imageContainer2.style.transform = transformImageValue2;
  }

  removeImage() {
    this.droppedFile = null;
    this.droppedFileURL = null;
    this.scaleFactorVal = '';
    this.scaleFactor = null;

    this.resetImageVariables();
  }

  changeOverlayMode() {
    const imageContainer2 = document.querySelector('.imageContainer2') as HTMLImageElement;
    let transformImageValue2 = `translateX(${this.currentZoomVal === 1 ? -this.sliderLeft : -(this.currentImageLeft * this.currentZoomVal + this.sliderLeft)}px) translateY(${this.currentImageTop * this.currentZoomVal + this.sliderTop}px)  scaleX(${(this.scaleXCustom + this.widthAdjustment / this.normalizePlotWidth) * this.currentZoomVal * this.flipX}) scaleY(${(1 + this.heightAdjustment / (this.normalizePlotWidth * this.aspectRatio)) * this.currentZoomVal * this.flipY}) rotate(${this.currentDegree}deg)`;
    imageContainer2.style.transform = transformImageValue2;

    if (this.displayAlignment) {
      this.legendWidth = 0;
    } else if (!this.displayAlignment && this.currentZoomVal === 1) {
      this.legendWidth = 120;
    }
    console.log("change in overlay, ", this.currentImageLeft, this.currentImageTop, this.widthAdjustment, this.heightAdjustment)
    this.callCreateScatterPlot();
  }
}