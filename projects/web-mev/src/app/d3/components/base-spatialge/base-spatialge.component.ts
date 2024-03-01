import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { NotificationService } from '@core/core.module';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';

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
  private readonly API_URL = environment.apiUrl;

  containerId = '#scatter';

  isLoading = false;

  scatterPlotData: ScatterDataNormailization[] = [];
  scatterPlotDataCluster: ScatterDataCluster[] = [];

  dataDict = {}

  xMin = Infinity
  xMax = -Infinity
  yMin = Infinity
  yMax = -Infinity
  totalCountsMax = 0;
  totalCountsMin = Infinity;

  totalCounts: any = {}

  scaleFactor = 0.01602821;
  geneSearch = 'VIM'

  selectedColor: string = 'Green';
  colors: string[] = ['Red', 'Green']

  plotOpacityValue = .7
  imageOpacityValue = .5

  overlayImage: boolean = false;
  displayPlot: boolean = true;
  displayImage: boolean = true;

  displayAlignment: boolean = false;
  displayZoom: boolean = false;

  scaleFactorVal = '0.01602821';
  geneSearchVal = 'VIM'

  moveAmount = 1;

  plotWidth = 300;
  plotHeight = 500;

  currentLeft = 0;
  currentTop = 0;

  widthAdjustment = 0
  heightAdjustment = 0

  droppedFile: File | null = null;
  droppedFileURL: string | ArrayBuffer | null = null;

  imageAdjustedWidth = 0;
  maxImageContainerWidthOverylay = this.plotWidth;
  maxImageContainerWidthSidebySide = this.plotWidth * 2;

  currentScaleFactor = 1;
  maxScaleFactor = 2;
  minScaleFactor = 0.5;

  useCluster = false;
  useNormalization = false;

  // legendWidth = 100;
  legendWidth = 0;

  clusterTypes = {}
  clusterColors = ["#EBCD00", "#52A52E", "#00979D", "#6578B4", "#80408D", "#C9006B", "#68666F", "#E80538", "#E87D1E"]

  selectionRectStyle = {};

  constructor(
    private httpClient: HttpClient,
    private readonly notificationService: NotificationService,
  ) { }

  // ngOnInit(): void {}

  resetVariables() {
    this.scatterPlotData = [];
    this.xMin = Infinity
    this.xMax = -Infinity
    this.yMin = Infinity
    this.yMax = -Infinity
    this.totalCountsMax = 0;
    this.totalCountsMin = Infinity;

    this.dataDict = {}
    this.plotWidth = 300;
    this.plotHeight = 500;
  }

  setScaleFactor(event: Event) {
    event.preventDefault();
    this.scaleFactor = parseFloat(this.scaleFactorVal)
    this.createScatterPlot()
  }

  setGeneSearch() {
    this.geneSearch = this.geneSearchVal.split('').map(letter => letter.toUpperCase()).join('');
    this.getDataNormalization()
  }

  onColorChange() {
    this.createScatterPlot()
  }

  updatePlotOpacity(value: number): void {
    this.plotOpacityValue = value;
  }

  updateImageOpacity(value: number): void {
    this.imageOpacityValue = value;
  }

  scrollTo(htmlID) {
    const element = document.getElementById(htmlID) as HTMLElement;
    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }

  originalPlotWidth = 0;
  originalPlotHeight = 0;
  getDataNormalization() {
    this.useNormalization = true;
    this.isLoading = true;
    this.scrollTo('scatter')
    this.resetVariables();
    let normalization_uuid = this.outputs["normalized_expression"];
    let coords_metadata_uuid = this.outputs["coords_metadata"]

    const normRequest = this.httpClient.get(`${this.API_URL}/resources/${normalization_uuid}/contents/?__rowname__=[eq]:${this.geneSearch}`).pipe(
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

    forkJoin([normRequest, coordsMetadataRequest]).subscribe(([normRes, coordsMetadataRes]) => {
      this.isLoading = false;
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
        let xVal = obj['values']['pxl_col_in_fullres'];
        let yVal = obj['values']['pxl_row_in_fullres'];
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

        if (!isNaN(parsedX) && !isNaN(parsedY) && !isNaN(totalCounts)) {
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
      this.plotWidth = (this.xMax - this.xMin) / 100;
      this.plotHeight = (this.yMax - this.yMin) / 100;

      if (this.originalPlotWidth === 0) {
        this.originalPlotWidth = this.plotWidth;
        this.originalPlotHeight = this.plotHeight;
      }

      this.selectionRectStyle = {
        top: `${0}px`,
        width: `${this.originalPlotWidth / 4}px`,
        height: `${this.originalPlotHeight / 4}px`,
        border: '2px solid #1DA1F2',
        position: 'absolute',
      };

      this.createScatterPlot()
    });
  }

  getDataClusters() {
    this.useCluster = true;
    this.isLoading = true;
    this.scrollTo('scatter')
    this.resetVariables();
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
        let xVal = obj['values']['pxl_col_in_fullres'];
        let yVal = obj['values']['pxl_row_in_fullres'];
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
      this.plotWidth = (this.xMax - this.xMin) / 100;
      this.plotHeight = (this.yMax - this.yMin) / 100;

      if (this.originalPlotWidth === 0) {
        this.originalPlotWidth = this.plotWidth;
        this.originalPlotHeight = this.plotHeight;
      }

      this.selectionRectStyle = {
        top: `${0}px`,
        width: `${this.originalPlotWidth / 4}px`,
        height: `${this.originalPlotHeight / 4}px`,
        border: '2px solid #1DA1F2',
        position: 'absolute',
      };

      this.createScatterPlot()

    });
  }

  createScatterPlot() {

    var margin = { top: 0, right: this.legendWidth, bottom: 0, left: 0 },
      width = this.plotWidth - margin.left + this.widthAdjustment,
      height = this.plotHeight - margin.top - margin.bottom + this.heightAdjustment;

    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    const pointTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event: any, d: any) => {
        let tipBox = this.useNormalization ? `<div><div class="category">Normalized Count:</div> ${d.totalCounts}</div>` : `<div><div class="category">Cluster ID:</div> ${d.clusterid}</div>`
        return tipBox
      });

    // append the svg object to the body of the page
    var svg = d3.select(this.containerId)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
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
      .domain([this.xMin * (this.scaleFactor), this.xMax * (1 + this.scaleFactor)])
      .range([0, width]);

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([this.yMin * this.scaleFactor, this.yMax * (1 + this.scaleFactor)])
      .range([height, 0]);

    let useNorm = this.useNormalization

    // Add dots
    svg.append('g')
      .selectAll("dot")
      .data(useNorm ? this.scatterPlotData : this.scatterPlotDataCluster)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return x(d.xValue) })
      .attr("cy", function (d) { return height - y(d.yValue); })
      .attr("r", 1.75)
      .attr("fill", d => {

        return useNorm ? color(d.totalCounts) : colorScale(d.clusterid)
      })
      .on('mouseover', function (mouseEvent: any, d) {
        pointTip.show(mouseEvent, d, this);
        pointTip.style('left', mouseEvent.x + 10 + 'px');
      })
      .on('mouseout', pointTip.hide);

    //Add Legend
    if (!this.displayZoom) {

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

        const legendX = 300;
        const legendY = this.legendWidth;
        const borderWidth = 1;
        const legendWidth = 50;
        const legendHeight = 10;

        svg.append("rect")
          .attr("x", legendX - borderWidth)
          .attr("y", legendY - borderWidth)
          .attr("width", legendWidth + 2 * borderWidth)
          .attr("height", legendHeight + 2 * borderWidth)
          .style("stroke", "rgba(0, 0, 0, 0.3)")
          .style("fill", "none");

        // Create legend rectangle
        svg.append("rect")
          .attr("x", legendX)
          .attr("y", legendY)
          .attr("width", legendWidth)
          .attr("height", legendHeight)
          .style("fill", "url(#legendGradient)")

        svg.append("text")
          .attr("x", legendX)
          .attr("y", 120)
          .attr("text-anchor", "start")
          .attr("font-size", "6px")
          .text("0");

        const xmaxLabelWidth = this.totalCountsMax.toString().toLocaleString().length * 1;  // Adjust the font size multiplier as needed
        const adjustedXmaxLabelX = legendX + 60 - xmaxLabelWidth;

        svg.append("text")
          .attr("x", adjustedXmaxLabelX)
          .attr("y", 120)
          .attr("text-anchor", "end")
          .attr("font-size", "6px")
          .text(this.totalCountsMax.toLocaleString());

        svg.append("text")
          .attr("x", legendX)
          .attr("y", 60)
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
            return 'translate(0,' + (i * 15 + 50) + ')';
          });

        legend
          .append('circle')
          .attr('r', 4)
          .attr('cx', width + 10)
          .attr('fill', d => d.color);

        legend
          .append('text')
          .attr('x', width + 20)
          .attr('dy', '.35em')
          .style('fill', '#000')
          .style('font-size', '8px')
          .attr('class', 'legend-label')
          .text(d => d.label);
      }
    }


  }

  moveImage(direction, mode) {
    const topContainer = document.querySelector('.plotContainer') as HTMLImageElement;
    const bottomContainer = document.querySelector('.imageContainer') as HTMLImageElement;

    const miniBottomContainer = document.querySelector('.miniMapImageContainer') as HTMLImageElement;
    const miniBoxContainer = document.querySelector('.boxDiv') as HTMLImageElement;

    let transformValue;
    // let transformMiniMapValue;
    let transformBox

    if (mode === 'align') {
      switch (direction) {
        case 'left':
          this.currentLeft -= this.moveAmount;
          break;
        case 'right':
          this.currentLeft += this.moveAmount;
          break;
        case 'up':
          this.currentTop -= this.moveAmount;
          break;
        case 'down':
          this.currentTop += this.moveAmount;
          break;
        default:
          break;
      }
    }

    let maxLeft = (this.currentScaleFactor - 1) * this.plotWidth / 2;
    let maxTop = (this.currentScaleFactor - 1) * this.plotHeight / 2;

    let scales = {
      "1": [0,0],
      "2": [50, 150],
      "3": [200, 400],
      "4": [400, 800],
      "5": [800, 1200]
    }

    let signLeft = this.currentLeft >= 0 ? 0 : 1
    let signTop = this.currentTop >= 0 ? 0 : 1

    transformValue = `translateX(${this.currentLeft}px) translateY(${this.currentTop}px) scale(${this.currentScaleFactor})`;
    transformBox = `translateX(${-scales[this.currentScaleFactor][signLeft] * this.currentLeft / maxLeft}%) translateY(${-scales[this.currentScaleFactor][signTop] * this.currentTop / maxTop}%) scale(${this.currentScaleFactor})`;
    if (mode === 'align' || mode === 'zoom') {
      topContainer.style.transform = transformValue;
      if (mode === 'zoom') {
        bottomContainer.style.transform = transformValue;
        miniBoxContainer.style.transform = transformBox;
      }
    }

    this.selectionRectStyle = {
      top: `${0}px`,
      width: `${this.plotWidth / (4 * this.currentScaleFactor)}px`,
      height: `${this.plotHeight / (4 * this.currentScaleFactor)}px`,
      border: '2px solid #1DA1F2',
      position: 'absolute',
    };

  }

  captureAndDownloadImages() {
    this.isLoading = true;

    setTimeout(() => {
      const containerToCapture = document.querySelector('.overlayDiv') as HTMLElement | null;

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

  applyZoom() {
    const plotContainer = document.querySelector('.plotContainer') as HTMLImageElement;
    const imageContainer = document.querySelector('.imageContainer') as HTMLImageElement;

    const miniBottomContainer = document.querySelector('.miniMapImageContainer') as HTMLImageElement;
    const miniMapContainer = document.querySelector('.miniMapContainer') as HTMLImageElement;

    const miniBoxContainer = document.querySelector('.boxDiv') as HTMLImageElement;

    this.currentLeft = 0;
    this.currentTop = 0;

    if (this.currentScaleFactor === 1) {
      this.currentLeft = 0;
      this.currentTop = 0;

      this.selectionRectStyle = {
        top: `${0}px`,
        width: `${this.originalPlotWidth / (4 * this.currentScaleFactor)}px`,
        height: `${this.originalPlotHeight / (4 * this.currentScaleFactor)}px`,
        border: '2px solid #1DA1F2',
        position: 'absolute',
      };
      let transformBox = `translateX(${this.currentLeft}px) translateY(${this.currentTop}px) scale(${this.currentScaleFactor})`;
      miniBoxContainer.style.transform = transformBox;
    }

    if (plotContainer || imageContainer) {
      const transformValue = `translateX(${this.currentLeft}px) translateY(${this.currentTop}px) scale(${this.currentScaleFactor})`;
      plotContainer.style.transform = transformValue;
      imageContainer.style.transform = transformValue;

      miniBottomContainer.style.transform = transformValue;

      const transformMiniMapValue = `scale(${1 / this.currentScaleFactor})`;
      miniMapContainer.style.transform = transformMiniMapValue
    }


    this.createScatterPlot()

  }

  stretchPlot(axis, direction) {
    if (axis === 'x-axis' && direction === '+') {
      this.widthAdjustment += 1;
    } else if (axis === 'x-axis' && direction === '-') {
      this.widthAdjustment -= 1;
    } else if (axis === 'y-axis' && direction === '+') {
      this.heightAdjustment += 1;
    } else if (axis === 'y-axis' && direction === '-') {
      this.heightAdjustment -= 1;
    }

    this.createScatterPlot()
  }

  setAlignmentMode() {
    this.displayZoom = false;
    this.createScatterPlot()
  }

  setZoomMode() {
    this.displayAlignment = false;
    this.createScatterPlot()
  }

  minLeftValue(): number {
    return -this.plotWidth * (this.currentScaleFactor - 1) / 2
    // return -this.plotWidth * this.currentScaleFactor + this.plotWidth;
  }

  maxLeftValue(): number {
    return this.plotWidth * (this.currentScaleFactor - 1) / 2
  }

  minTopValue(): number {
    return -this.plotHeight * (this.currentScaleFactor - 1) / 2
  }

  maxTopValue(): number {
    return this.plotHeight * (this.currentScaleFactor - 1) / 2
  }
}