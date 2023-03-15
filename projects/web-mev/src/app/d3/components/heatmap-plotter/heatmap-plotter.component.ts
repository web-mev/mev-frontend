import { Component, OnInit, Input, ChangeDetectionStrategy, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormGroup, Validators, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { MatExpansionPanel } from '@angular/material/expansion';
import { NotificationService } from '@core/notifications/notification.service';

@Component({
  selector: 'd3-heatmap',
  templateUrl: './heatmap-plotter.component.html',
  styleUrls: ['./heatmap-plotter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class D3HeatmapPlotComponent implements OnInit {
  /*
  An array of items where each item looks like:
  { 'rowname': 'A1BG', 'values': {'sA':1, 'sB':2,...}}
  that is, values is an object where the keys are samples/observations
  and they point at the expression for that sample
  */
  @Input() resourceData;
  @Input() resourceDataAnnotation;
  @Input() useAnnotation;
  @Input() hasResourceChanged

  @ViewChild('heatmap')
  svgElement: ElementRef;

  @ViewChild(MatExpansionPanel) plotOptionsPanel: MatExpansionPanel;

  customObservationSets = [];
  customObservationSetsToPlot = [];
  heatmapData = [];
  plotReady = false;
  tilesTooSmall = false;
  validPlot = false;
  warnMsg = '';
  imgAdjustForm: FormGroup;
  panelOpenState = false;

  // heatmap settings
  tickLabelFontSize = 8;

  // this dictates a minimum width for the annotation overlay. The actual size
  // will vary depending on the screen dimensions, but this gives us a starting point
  annotationLegendMinWidth = 300;

  // This prescribes the height for a legend corresponding to a 
  // continuous variable, which is drawn as a gradient. This does not
  // need to be dynamic like the category boxes (Which can contain
  // an arbitrary number of levels)
  gradientLegendTypeHeight = 80;

  // for legends corresponding to categorical displays,
  // only show up to this many levels
  maximumCategoricalLevels = 6;

  // relative to the SVG element's container,
  // this is how far the circular markers are
  // offset from the top
  categoricalLegendMarkerOffset = 30;
  categoricalLegendMarkerSpacing = 27;

  gradientMinColor = 'royalblue';
  gradientMaxColor = 'crimson';
  gradientBarHeight = 8;
  gradientBarPadding = 10;

  annotationPadding;

  featuresLabel = 'genes/features';
  observationsLabel = 'observations/samples';

  windowWidth = 1600;
  windowHeight = 900;
  imageName = 'heatmap'; // file name for downloaded SVG image
  precision = 2;
  outerHeight;
  outerWidth;
  targetTileSize = 20; // a reasonable default tile size to aim for
  minTileSize = 1; // originally set to 5
  tooltipOffsetX = 10; // to position the tooltip on the right side of the triggering element
  showObsLabels = true; //whether to label the obs
  showFeatureLabels = false; //whether to label the features
  logScale = false;
  margin;
  categoryOptions = {};
  categoryOptionsArr = [];
  marginAnnotation = { top: 50, right: 200, bottom: 50, left: 100 }; // chart margins for annotations included
  marginMain = { top: 0, right: 0, bottom: 0, left: 0 }; // chart margins
  heightCategory = 12; //height of individual category overlay
  containerId = '#heatmap';
  // for common reference when determining the orientation of the heatmap
  samplesInColumnsKey = '__SIC__';
  samplesInColumnsText = 'Samples/observations in columns';
  samplesInRowsKey = '__SIR__';
  samplesInRowsText = 'Samples/observations in rows';
  squareTiles = false; //if true, then the tiles will be squares
  orientationOptions = [
    { label: this.samplesInColumnsText, key: this.samplesInColumnsKey },
    { label: this.samplesInRowsText, key: this.samplesInRowsKey },
  ];
  orientation;


  colormapOptions = {
    'Brown-blue-green': d3.interpolateBrBG,
    'Purple-green': d3.interpolatePRGn,
    'Purple-orange': d3.interpolatePuOr,
    'Red-blue': d3.interpolateRdBu,
    'Red-yellow-blue': d3.interpolateRdYlBu,
    'Viridis': d3.interpolateViridis,
    'Ciridis': d3.interpolateCividis,
    'Lioness': d3.interpolateRgb("blue", "white", "red")
  }
  colormapList = Object.keys(this.colormapOptions);
  defaultColormap = 'Red-blue';
  selectedColormap = '';
  annData = {};
  categoryToIgnore = [];
  removeOverlayArray = [];
  xAxisArr = [];
  yLocationLengend = 0;
  hideOverlay = false;

  constructor(
    private metadataService: MetadataService,
    private formBuilder: FormBuilder,
    private readonly notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.windowWidth = window.innerWidth - 500;
    this.windowHeight = window.innerHeight

    this.margin = this.marginMain;

    this.customObservationSets = this.metadataService.getCustomObservationSets();

    this.imgAdjustForm = this.formBuilder.group({
      'imgAspectRatio': ['', ''],
      'imgObsLabels': [this.showObsLabels, ''],
      'imgFeatureLabels': [this.showFeatureLabels, ''],
      'logScale': [this.logScale, ''],
      'colormaps': [this.defaultColormap, ''],
    })

    this.generateHeatmap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.margin = this.useAnnotation ? this.marginAnnotation : this.marginMain;
    this.heatmapData = this.resourceData;

    this.generateHeatmap()
  }

  generateHeatmap() {
    //reset variables when changing resources
    if (this.hasResourceChanged) {
      this.removeOverlayArray = [];
      this.annData = {};
    }

    if (this.resourceData.length > 0) {
      this.outerHeight = Math.max(this.windowHeight, 500)
      this.outerWidth = Math.max(this.windowWidth, 500)
      this.createHeatmap();
      this.plotReady = true;
    }
  }

  /*
  * Accessor function used by the html template
  */
  get customGroups() {
    return this.imgAdjustForm.get('imgGroups') as FormArray;
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() {
    return this.imgAdjustForm.controls;
  }

  onSubmit() {

    if (this.imgAdjustForm.value['imgAspectRatio']) {
      this.squareTiles = true;
    } else {
      this.squareTiles = false;
    }

    if (this.imgAdjustForm.value['imgObsLabels']) {
      this.showObsLabels = true;
    } else {
      this.showObsLabels = false;
    }

    if (this.imgAdjustForm.value['imgFeatureLabels']) {
      this.showFeatureLabels = true;
    } else {
      this.showFeatureLabels = false;
    }

    if (this.imgAdjustForm.value['logScale']) {
      this.logScale = true;
    } else {
      this.logScale = false;
    }

    let chosenMap = this.imgAdjustForm.value['colormaps'];
    if (this.colormapList.includes(chosenMap)) {
      this.selectedColormap = chosenMap;
    }

    this.panelOpenState = false;
    this.plotOptionsPanel.close();

    if (this.imgAdjustForm.value.imgOrientation === this.samplesInRowsKey) {
      this.hideOverlay = true;
      this.margin.left = 200;
      this.margin.right = 100;
    } else {
      this.hideOverlay = false;
      this.margin.left = 100;
      this.margin.right = 200;
    }

    this.generateHeatmap();
  }

  makeScale(domain, range) {
    // helper function for generating d3 scale objects
    return d3.scaleBand()
      .domain(domain)
      .rangeRound(range)
      .paddingInner(0)
  }

  clearChart() {
    d3.select(this.containerId)
      .selectAll('svg')
      .remove();
  }

  reformatData() {

    let reformattedData = [];
    let allFeatures = [];
    let allObservations = [];
    let minVal = null;
    let maxVal = null;
    let orderedObservations = [];

    this.heatmapData.forEach(
      (item, idx) => {
        let rowname = item.rowname;
        let valueMap = item.values;

        allFeatures.push(rowname);
        if (idx == 0) {
          allObservations = Object.keys(valueMap);

          // If the user requested plotting specific observation sets (in order!)
          // we have to rearrange the allObservations array
          if (this.customObservationSetsToPlot.length > 0) {
            this.customObservationSetsToPlot.forEach(
              obsSet => {
                obsSet.elements.forEach(
                  el => orderedObservations.push(el.id)
                )
              }
            );
          } else {
            orderedObservations = allObservations;
          }

          let initVals = [];
          for (let [obsId, v] of Object.entries(valueMap)) {
            const val = Number(v);
            if (orderedObservations.includes(obsId)) {
              initVals.push(val);
            }
          }

          // set the min/max values to start- these will
          // be updated as we iterate through the heatmap data
          minVal = d3.min(initVals);
          maxVal = d3.max(initVals);
        }
        for (let [obsId, v] of Object.entries(valueMap)) {
          const val = Number(v);

          // update the min/max values
          if (val < minVal) {
            minVal = val;
          } else if (val > maxVal) {
            maxVal = val;
          }

          if (orderedObservations.includes(obsId)) {
            reformattedData.push(
              {
                featureId: rowname,
                obsId: obsId,
                value: val // we want to display the true data on hover. Even if logged, that will only affect the color.
              }
            );
          }
        }
      }
    );
    return [reformattedData, allFeatures, orderedObservations, minVal, maxVal];
  }

  adjustForLogScale(minVal, maxVal) {
    let pseudocount = 0;
    if (this.logScale) {

      // if the minimum is less than zero, we can't take the log.
      // Since the plot is effectively qualitative (since it's a visual depiction)
      // we simply tranlate all the numbers so that the minimum is zero
      if (minVal < 0) {
        let offset = Math.abs(minVal);
        minVal += offset;
        maxVal += offset;
      }

      // at this point we have non-negative numbers. May still have an issue
      // where we try to take a log of zero. If we were guaranteed integer count
      // data, we could just add a pseudocount. However, we may be dealing some other
      // kind of data (e.g. on a range of [0,1]) where that would ruin the plot.
      // As a workaround to this, we add our "pseudocount" as a fraction (say, 0.1%) of the data's range
      // For example, if the range goes from [0,1], adding 0.001 won't affect the qualitative nature
      // of the plot. Same goes for larger ranges. e.g. if it's [0,100], then making the minimum=0.1
      // is not going to materially affect the visual.
      if (minVal === 0) {
        pseudocount = 0.001 * (maxVal - minVal);
        minVal += pseudocount;
        maxVal += pseudocount;
      }

      minVal = Math.log2(minVal);
      maxVal = Math.log2(maxVal);
    }
    return [pseudocount, minVal, maxVal];
  }

  setTileSizes(xScale, yScale) {

    // use the bandwidth to establish the final sizes
    let xB = xScale.bandwidth();
    let yB = yScale.bandwidth();

    let tileX, tileY;
    if (this.squareTiles) {
      // set the ratio to the smaller of the two scales. Otherwise we would 
      // exceed the "natural" exterior dimensions of the figure

      if (xB > yB) {
        // if the tiles are "naturally" wide and short, we will
        // shrink the horizontal direction. However, we need to allow
        // for potential axis labels, so if yB is smaller than 
        // targetTileSize, then we set the tile size to that.
        // This will result in the figure increasing its vertical space,
        // but that's fine
        if (yB < this.targetTileSize) {
          yB = this.targetTileSize;
        }
        tileX = tileY = yB;

      } else {
        // tiles are naturally "tall". We don't want to create 
        // horizontal scrolls, so we shrink the vertical direction
        tileX = tileY = xB;
      }
    } else {
      tileX = xB;
      tileY = yB;
    }
    return [tileX, tileY];
  }

  isNumericScale(values: any[]) {
    let isNumber = true;
    for (let i = 0; i < values.length; i++) {
      if (isNaN(values[i])) {
        isNumber = false
      }
    }
    return isNumber;
  }

  createHeatmap() {
    console.log('Start createHeatmap. Outer height:', this.outerHeight);
    // before doing anything, get rid of anything that may have been there
    this.clearChart();

    if (this.heatmapData.length === 0) {
      this.validPlot = false;
      return
    }

    let categoryCount = this.setAnnotationData();
    // this sets how much extra space we allocate for showing the
    // annotation overlays. Note that if we are hiding the annotations
    // then categoryCount = 0
    this.annotationPadding = categoryCount * this.heightCategory + 20;

    let annotationLegendWidth = this.hideOverlay ? 0 : this.annotationLegendMinWidth;

    this.xAxisArr = [];
    this.categoryToIgnore = [];

    // using the first item of the heatmapData, get the sample/observation names
    for (let col in this.heatmapData[0].values) {
      this.xAxisArr.push(col);
    }

    // reformat the data so it's easier to work with in d3
    let [reformattedData, allFeatures, orderedObservations, minVal, maxVal] = this.reformatData();

    // to get an estimate for the size of the observation and feature labels, get the maximum length
    // of the strings for each:
    console.log(allFeatures);
    console.log(orderedObservations);
    let longestObsName, longestFeatureName = 0;
    if (this.showFeatureLabels || this.showObsLabels) {
      longestObsName = Math.max(...orderedObservations.map(x => x.length));
      longestFeatureName = Math.max(...allFeatures.map(x => x.length));
    }
    console.log(longestObsName, longestFeatureName);

    console.log('BEFORE:');
    console.log(this.margin);
    console.log(this.outerWidth, this.outerHeight);
    // by default, orient the heatmap such that it has a portrait
    // orientation. Vertical scrolls are fine, but horizontal makes 
    // other page elements look poor
    if (allFeatures.length >= orderedObservations.length) {
      // more features than observations. Hence, each row
      // corresponds to a feature and each column is a row
      this.orientation = this.samplesInColumnsKey;
      this.margin.top = this.annotationPadding;

      // using the font size and longest labs, give a rough size for the 
      // room necessary to show those labels
      if (this.showFeatureLabels) {
        this.margin.left = this.tickLabelFontSize * longestFeatureName;
      }
      if (this.showObsLabels) {
        this.margin.bottom = this.tickLabelFontSize * longestObsName;
      }

      // based on the screen dimensions and left margin, figure out how much room we have for
      // the heatmap and the annotation legend (if used)

      let tmpHeatmapWidth = this.outerWidth - this.margin.left - annotationLegendWidth;

      // given an estimated heatmap width, find the "default" tile width.
      // If that width is wider than our target, just set it to the target width--
      // super wide tiles are not visually appealing. Tiles can be smaller than the
      // target width, however. Tiles too small to visualize will be caught later.
      let tmpTileWidth = tmpHeatmapWidth / orderedObservations.length;
      if (tmpTileWidth > this.targetTileSize) {
        tmpTileWidth = this.targetTileSize;
      }
      console.log(tmpTileWidth);
      this.margin.right = this.outerWidth - tmpTileWidth * orderedObservations.length - this.margin.left;

      // since we allow vertical scrolling, we can set the height of the heatmap.
      // Given the screen size and accounting for the top and bottom margins, how much
      // space to we have for the heatmap itself:
      let tmpHeatmapHeight = this.outerHeight - this.margin.top - this.margin.bottom;
      let tmpTileHeight = tmpHeatmapHeight / allFeatures.length;

      // if the tiles are tall, shorten them
      if (tmpTileHeight > this.targetTileSize) {
        tmpTileHeight = this.targetTileSize;
      } else if (tmpTileHeight < this.minTileSize) {
        // if the tiles are too small in height, increase their size
        tmpTileHeight = this.minTileSize;
      }

      // now, given the tile height, adjust the this.outerHeight, since we
      // can afford to scroll
      this.outerHeight = tmpTileHeight * allFeatures.length + this.margin.top + this.margin.bottom;


    } else {

      this.orientation = this.samplesInRowsKey;
      if (this.showFeatureLabels) {
        this.margin.bottom = this.tickLabelFontSize * longestFeatureName;
      }

      // for this orientation, we need to account for:
      // - annotation overlay (optional)
      // - heatmap
      // - observation labels (optional)
      // - annotation legend (optional)
      let obsLabelWidth = 0;
      if (this.showObsLabels) {
        obsLabelWidth = this.tickLabelFontSize * longestObsName;
      }
      this.margin.left = this.annotationPadding + obsLabelWidth;

      // the available width after taking the "extra" stuff into account:
      let tmpHeatmapWidth = this.outerWidth - annotationLegendWidth - this.margin.left;
      let tmpHeatmapHeight = this.outerHeight - this.margin.bottom;
      let tmpTileWidth = tmpHeatmapWidth / allFeatures.length;
      let tmpTileHeight = tmpHeatmapHeight / orderedObservations.length;
      if (tmpTileWidth > this.targetTileSize) {
        tmpTileWidth = this.targetTileSize;
      }
      if (tmpTileHeight > this.targetTileSize) {
        tmpTileHeight = this.targetTileSize;
      } else if (tmpTileHeight < this.minTileSize) {
        tmpTileHeight = this.minTileSize;
      }
      // now, given the tile height, adjust the this.outerHeight, since we
      // can afford to scroll
      this.outerHeight = tmpTileHeight * orderedObservations.length + this.margin.top + this.margin.bottom;
      this.margin.right = this.outerWidth - tmpTileWidth * allFeatures.length - this.margin.left;

    }

    console.log('AFTER:');
    console.log(this.margin);
    console.log(this.outerWidth, this.outerHeight);

    let totalLegendAllocation = this.calculateLegendAllocation(true);
    if (totalLegendAllocation > this.outerHeight) {
      console.log('legend was taller than outerheight- adjust!');
      this.outerHeight = totalLegendAllocation + 10;
    }
    console.log('Here(0): ', this.outerHeight);
    let heatmapWidth = this.outerWidth - this.margin.left - this.margin.right;
    let heatmapHeight = this.outerHeight - this.margin.top - this.margin.bottom;

    let pseudocount = 0;
    if (this.logScale) {
      [pseudocount, minVal, maxVal] = this.adjustForLogScale(minVal, maxVal);
    }

    /* Setting up X-axis and Y-axis*/
    let xDomain, yDomain, xSelector, ySelector, featureAxis, obsAxis;
    if (this.orientation === this.samplesInColumnsKey) {

      // if in this orientation, the x values should
      // correspond to samples/observations
      xDomain = orderedObservations;
      yDomain = allFeatures;
      xSelector = 'obsId';
      ySelector = 'featureId';
      featureAxis = 'y';
      obsAxis = 'x'
    } else { // if we have samples corresponding to rows
      yDomain = orderedObservations;
      xDomain = allFeatures;
      ySelector = 'obsId';
      xSelector = 'featureId';
      featureAxis = 'x';
      obsAxis = 'y'
    }

    // setup initial x and y scales
    let xScale = this.makeScale(xDomain, [this.margin.left, this.margin.left + heatmapWidth]);
    let yScale = this.makeScale(yDomain, [this.margin.top, this.margin.top + heatmapHeight]);
    //let maxGraphHeight = this.windowHeight * .9 //1200 or 900 better?
    //let yScale = this.yLocationLengend > this.windowHeight ? this.makeScale(yDomain, [this.margin.top, maxGraphHeight]) : this.makeScale(yDomain, [this.margin.top, this.margin.top + heatmapHeight]);

    console.log('Just before setting final tile sizes, outerheight=', this.outerHeight);
    let tileX, tileY;
    [tileX, tileY] = this.setTileSizes(xScale, yScale);

    if ((tileX < this.minTileSize) || (tileY < this.minTileSize)) {
      this.tilesTooSmall = true;
      this.validPlot = false;
      return
    } else {
      this.tilesTooSmall = false;
    }
    heatmapWidth = tileX * xDomain.length;
    heatmapHeight = tileY * yDomain.length;

    // reset the scales to the final widths/height so everything lines up well
    xScale = this.makeScale(xDomain, [this.margin.left, this.margin.left + heatmapWidth]);
    yScale = this.makeScale(yDomain, [this.margin.top, this.margin.top + heatmapHeight]);

    // readjust the total plot area (the SVG wrapper)
    this.outerWidth = heatmapWidth + this.margin.left + this.margin.right;
    this.outerHeight = heatmapHeight + this.margin.top + this.margin.bottom;
    if (totalLegendAllocation > this.outerHeight) {
      console.log('legend was taller than outerheight- adjust!');
      this.outerHeight = totalLegendAllocation + 10;
    }
    console.log('After setting final tiles, etc, we have outerHeight=', this.outerHeight);

    // tool tip for individual points (if displayed)
    const pointTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        let tipBox = `<div><div class="category">Genes:</div> ${d.featureId}</div>
                      <div><div class="category">Sample: </div> ${d.obsId}</div>
                      <div><div class="category">Value: </div>${d.value.toFixed(this.precision)}</div>`
        return tipBox
      });

    const pointTipOverlay = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d, value, category) => {
        let tipBox = `<div><div class="category">Sample: </div>${d}</div>
                      <div><div class="category">Category: </div>${category.replace(/_/g, " ").charAt(0).toUpperCase() + category.replace(/_/g, " ").slice(1)}</div>
                      <div><div class="category">Value: </div>${value}</div>`
        return tipBox
      });

    const legendInfoTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(() => {
        let tipBox = `<div class="legendInfo">Since we cannot distinguish categorical attributes identified by numbers, 
                      they will be displayed using a gradient. If you would like to change this behavior, change your group 
                      identifiers to be non-numerical.</div>`
        return tipBox
      });

    const svg = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', this.outerWidth)
      .attr('height', this.outerHeight)
      .append('g')
      .style('fill', 'none');

    const tooltipOffsetX = this.tooltipOffsetX;
    svg.call(pointTip);
    svg.call(pointTipOverlay);
    svg.call(legendInfoTip);

    let heatmapTiles = svg.append('g');
    let selection = heatmapTiles.selectAll('rect')
      .data(reformattedData, (d) => '(' + d[xSelector] + ',' + d[ySelector] + ')');

    if (this.selectedColormap === '') {
      this.selectedColormap = this.defaultColormap;
    }
    let colormapInterpolator = this.colormapOptions[this.selectedColormap];
    minVal = -Math.max(Math.abs(minVal), Math.abs(maxVal))
    maxVal = Math.max(Math.abs(minVal), Math.abs(maxVal))

    let lionessColor = d3.scaleLinear()
      .range(["royalblue", "#fffafa", "crimson"])
      .domain([minVal, 0, maxVal])

    selection
      .enter()
      .append('rect')
      .attr('x', d => xScale(d[xSelector]))
      .attr('y', d => yScale(d[ySelector]))
      .attr('height', tileY)
      .attr('width', tileX)
      .attr('fill', d => {
        // note that 'value' is the actual value of the data.
        // If we are log-transforming for the plot, we only use that transform
        // to represent the color. This way, the user can still see the true 
        // value of the data on the mouseover event
        let dataValue = this.logScale ? Math.log2(d['value'] + pseudocount) : d['value'];
        // return colormapInterpolator(
        //   (dataValue - minVal) / (maxVal - minVal)
        // )

        //for lioness
        return lionessColor(dataValue)
      })
      .on('mouseover', function (mouseEvent: any, d) {
        pointTip.show(mouseEvent, d, this);
        pointTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
      })
      .on('mouseout', pointTip.hide);

    // Category and legend overlay
    // This avoids issues of scope with closures below-- 
    let tempAnnotations = { ...this.annData }
    console.log('ann data:');
    console.log(this.annData);
    //console.log(tempAnnotations);
    let colorRange = ["#ac92eb", "#4fc1e8", "#a0d568", "#ffce54", "#ed5564", "#feb144"];
    let catOptions = [];
    let count = 0; //Keeps track of overlay items for the legends for y position and overall number of overlay items
    let spacer = 0;
    if (this.orientation === this.samplesInColumnsKey) {
      spacer = this.margin.top - 30; //30 is the height of the space between graph and overlay
    } else {
      spacer = 10;
    }
    let legendPadding = 10; // space between heatmap area and annotations

    // note that we display the legend in reverse order compared to the 
    // tile-based annotation overlay. This makes it align more naturally.
    // Thus, we "work-backwards/upwards" from the bottom
    let currentLegendAllocation = this.calculateLegendAllocation(false);
    let catYLocation = currentLegendAllocation;

    console.log('this.categoryOptions');
    console.log(this.categoryOptions);
    if (this.hideOverlay === false) {

      // this holds the graphical overlay of the annotations
      // that lines up with the heatmap
      let annotationOverlay = svg.append('g');

      // this holds the legend for the annotations
      let legendOverlay = svg.append('g')
        .attr("transform", `translate(${heatmapWidth + this.margin.left + legendPadding + 20}, 0)`);

      // iterate through the annotation categories, adding the visuals and legend
      for (let numericalCatIndex in this.categoryOptionsArr) {
        let index = this.categoryOptionsArr[numericalCatIndex];
        let isNumber = this.isNumericScale(this.categoryOptions[index]);

        let catLegend, legendTitleNode;
        if (!this.removeOverlayArray.includes(index)) {
          // create the common elements for the legends (like title, the "X" close button, etc.)
          catLegend = legendOverlay.append("svg")
            .attr('x', 0)
          //.attr('y', catYLocation)

          // add the "title" for the category
          legendTitleNode = catLegend.append('text')
            .attr('x', 0)
            .attr('y', 15)
            .attr("class", index)
            .style('fill', 'rgba(0,0,0,.7)')
            .style('font-size', '10px')
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(index.replace(/_/g, " ").toUpperCase())

          // add the "X" button which allows removal of the legend
          // and annotation tiles: 
          catLegend.append('text')
            .attr('x', this.annotationLegendMinWidth - 20)
            .attr('y', 15)
            .attr("class", "closePointer")
            .style('fill', 'rgba(0,0,0,.5)')
            .style('font-size', '12px')
            .attr("text-anchor", "start")
            .text("X")
            .on("click", () => {
              this.removeOverlay(index)
            })
            .on("mouseover", function (d) {
              d3.select(this).style("fill", "rgba(0,0,0,.8)");
            })
            .on("mouseout", function (d) {
              d3.select(this).style("fill", "rgba(0,0,0,.5)");
            });
        }

        //If all values are numbers, will use a gradient
        if (isNumber && !this.removeOverlayArray.includes(index)) {
          let min = Math.trunc(Math.floor(Math.min(...this.categoryOptions[index])))
          let max = Math.trunc(Math.ceil(Math.max(...this.categoryOptions[index])))
          console.log(`gradient with count=${count}`);
          if (min !== max) {

            // Build color scale for colored annotation boxes:
            var annotationColorScale = d3.scaleLinear()
              .range([this.gradientMinColor, this.gradientMaxColor])
              .domain([min, max])

            // add the annotation tile which aligns with the heatmap
            if (tempAnnotations[orderedObservations[0]] !== undefined) {
              this.addAnnotationOverlayTile(
                annotationOverlay,
                pointTipOverlay,
                tempAnnotations,
                index,
                orderedObservations,
                xScale,
                yScale,
                annotationColorScale,
                count
              );
            }
            count++;

            // now add the legend for this category:

            // add an info tooltip to explain the colorbar
            catLegend.append('text')
              .attr('x', legendTitleNode.node().getComputedTextLength() + 5)
              .attr('y', 15)
              .attr("class", "closePointer")
              .style('fill', 'rgba(0,0,0,.7)')
              .style('font-size', '10px')
              .style('font-weight', 'bold')
              .text("ⓘ")
              .on('mouseover', function (mouseEvent: any, d) {
                legendInfoTip.show(mouseEvent, d, this);
                legendInfoTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
              })
              .on('mouseout', legendInfoTip.hide);

            // Setup a linear color gradient for the legend:
            let gradientColorData = [
              { "color": this.gradientMinColor, "value": min },
              { "color": this.gradientMaxColor, "value": max }
            ];
            let gradientRange = [min, max];
            let defs = catLegend.append("defs");
            let linearGradient = defs
              .append("linearGradient")
              .attr("id", "myGradient");

            linearGradient.selectAll("stop")
              .data(gradientColorData)
              .enter().append("stop")
              .attr("offset", d => ((d.value - gradientRange[0]) / (gradientRange[1] - gradientRange[0]) * 100) + "%")
              .attr("stop-color", d => d.color);

            let gradientColorbarGroup = catLegend.append("g")
              .attr("transform", `translate(${this.gradientBarPadding + 10}, 30)`);

            let innerWidth = this.annotationLegendMinWidth - (this.gradientBarPadding * 2);
            gradientColorbarGroup.append("rect")
              .attr("width", innerWidth - 100)
              .attr("height", this.gradientBarHeight)
              .style("fill", "url(#myGradient)");

            let gradientScale = d3.scaleLinear()
              .range([0, innerWidth - 100])
              .domain(gradientRange);
            let xAxisGradient = d3.axisBottom(gradientScale)
              .tickSize(this.gradientBarHeight * 2)
              .tickValues(gradientRange);

            gradientColorbarGroup.append("g")
              .call(xAxisGradient)
              .select(".domain")

            catYLocation -= this.gradientLegendTypeHeight;
            catLegend.attr('y', catYLocation)

          } else {
            this.categoryToIgnore.push(index.replace(/_/g, " "))
          }

        }
        //For use if values are categorical
        else if (this.categoryOptions[index].length <= this.maximumCategoricalLevels
          && this.categoryOptions[index].length > 1
          && !this.removeOverlayArray.includes(index)) {

          catOptions = this.categoryOptions[index]
          let ordinalColorScale = d3.scaleOrdinal()
            .range(colorRange)
            .domain(catOptions)

          console.log(`category with count=${count}`);

          if (tempAnnotations[orderedObservations[0]] !== undefined) {
            this.addAnnotationOverlayTile(
              annotationOverlay,
              pointTipOverlay,
              tempAnnotations,
              index,
              orderedObservations,
              xScale,
              yScale,
              ordinalColorScale,
              count
            );
          }
          count++;

          // Add legend for this categorical display
          catYLocation -= (catOptions.length * this.categoricalLegendMarkerSpacing) + 20 //height of each row and space between the legends 
          catLegend
            .attr('y', catYLocation)
          catLegend.selectAll("mydots")
            .data(catOptions)
            .enter()
            .append("circle")
            .attr("cx", 10)
            .attr("cy", (d, i) => { return this.categoricalLegendMarkerOffset + i * 20 })
            .attr("r", 5)
            .style("fill", d => {
              return ordinalColorScale(d)
            })

          // Add one dot in the legend for each name.
          catLegend.selectAll("mylabels")
            .data(catOptions)
            .enter()
            .append("text")
            .attr("x", 20)
            .attr("y", (d, i) => { return this.categoricalLegendMarkerOffset + i * 20 })
            .style("fill", "rgba(0,0,0,.7)")
            .style('font-size', '8px')
            .text(function (d) {
              return d
            })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
        }
        //categories not to display
        else if (this.categoryOptions[index].length > this.maximumCategoricalLevels || this.categoryOptions[index].length <= 1) {
          this.categoryToIgnore.push(index.replace(/_/g, " "))
        }
      }
    }

    selection
      .exit()
      .remove();

    if (this.showObsLabels || this.showFeatureLabels) {
      let axesContainer = svg.append('g');

      if (this.showObsLabels) {
        if (obsAxis === 'x') {
          if (tileX > this.tickLabelFontSize) {
            axesContainer.append('g')
              .call(d3.axisBottom(xScale))
              .attr('transform', 'translate(0,' + (this.margin.top + heatmapHeight) + ')')
              .selectAll('text')
              .attr("y", -2)
              .attr("x", -10)
              .attr("transform", "rotate(-90)")
              .style("text-anchor", "end")
              .style("font-size", `${this.tickLabelFontSize}px`)
          } else {
            this.textTooSmallWarning(this.observationsLabel);
          }

        } else {
          if (tileY > this.tickLabelFontSize) {
            axesContainer.append('g')
              .call(d3.axisLeft(yScale))
              .attr('transform', 'translate(' + this.margin.left + ', 0 )')
              .style("font-size", `${this.tickLabelFontSize}px`);
          } else {
            this.textTooSmallWarning(this.observationsLabel);
          }
        }
      }

      if (this.showFeatureLabels) {
        if (featureAxis === 'x') {
          if (tileX > this.tickLabelFontSize) {
            axesContainer.append('g')
              .call(d3.axisBottom(xScale))
              .attr('transform', 'translate(0,' + (this.margin.top + heatmapHeight) + ')')
              .selectAll('text')
              .attr("y", -2)
              .attr("x", -10)
              .attr("transform", "rotate(-90)")
              .style("text-anchor", "end")
              .style("font-size", `${this.tickLabelFontSize}px`)
          } else {
            this.textTooSmallWarning(this.featuresLabel);
          }
        } else { //if features are on the vertical axis
          if (tileY > this.tickLabelFontSize) {
            axesContainer.append('g')
              .call(d3.axisLeft(yScale))
              .attr('transform', 'translate(' + this.margin.left + ', 0 )')
              .style("font-size", `${this.tickLabelFontSize}px`);
          }else {
            this.textTooSmallWarning(this.featuresLabel);
          }
        }

      }
    }

    this.scrollTo('heatmap');
    if (this.categoryToIgnore.length > 0 && this.isAlert === false) {
      this.isAlert = true
      this.sendAlertMessage()
    }
    this.validPlot = true;
  }
  isAlert = false

  /**
   * Function is triggered when resizing the chart
   */
  onResize(event) {
    //this.generateHeatmap();
  }


  addAnnotationOverlayTile(annotationOverlay,
    pointTipOverlay,
    annotations,
    category,
    observations,
    xScale,
    yScale,
    colorScale,
    count) {
    let spacer;
    if (this.orientation === this.samplesInColumnsKey) {
      spacer = this.margin.top - 30; //30 is the height of the space between graph and overlay
    } else {
      spacer = 10;
    }

    // declared to handle scoping inside closure below
    // in the mouseover callback
    const tooltipOffsetX = this.tooltipOffsetX;

    annotationOverlay.selectAll()
      .data(observations)
      .join("rect")
      .attr("x", d => {
        if (this.orientation === this.samplesInColumnsKey) {
          // if we are orienting vertically, need to place
          // the rectangle according to our x-axis scale:
          return xScale(d)
        }
        // if we are orienting samples in rows, the annotations
        // are on the left side
        return this.annotationPadding - count * this.heightCategory
      })
      .attr("y", d => {
        if (this.orientation === this.samplesInColumnsKey) {
          return spacer - count * this.heightCategory
        }
        return yScale(d)
      })
      .attr("width", d => {
        if (this.orientation === this.samplesInColumnsKey) {
          return xScale.bandwidth() - 0.4
        }
        return this.heightCategory - 0.4
      })
      .attr("height", d => {
        if (this.orientation === this.samplesInColumnsKey) {
          return this.heightCategory - 0.4
        }
        return yScale.bandwidth() - 0.4
      })
      .style("fill", d => {
        return annotations[d] !== undefined ? colorScale(annotations[d][category]) : 'black'
      })
      .on('mouseover', function (mouseEvent: any, d) {
        pointTipOverlay.show(mouseEvent, d, annotations[d][category], category, this);
        pointTipOverlay.style('left', mouseEvent.x + tooltipOffsetX + 'px');
      })
      .on('mouseout', pointTipOverlay.hide);
  }

  onObservationCheck(e) {
    const sampleSet = e.source.id;
    const foundSet = this.customObservationSets.find(
      el => el.name === sampleSet
    );

    if (e.checked) {
      this.customObservationSetsToPlot.push(foundSet);
    } else {
      this.customObservationSetsToPlot = this.customObservationSetsToPlot.filter(
        set => set.name !== foundSet.name
      );
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.customObservationSetsToPlot, event.previousIndex, event.currentIndex);
  }

  setAnnotationData() {

    // if we are not showing the annotations, then
    // we don't need to do anything- return zero
    // to signal that we don't need additional room
    // for the annotation overlay
    if (this.hideOverlay === true) {
      return 0;
    }

    this.xAxisArr = [];
    this.categoryOptionsArr = [];
    this.categoryOptions = {};
    for (let i = 0; i < this.resourceDataAnnotation.length; i++) {
      let rowName = this.resourceDataAnnotation[i].rowname;
      let values = this.resourceDataAnnotation[i].values;
      let temp = {}
      for (let key in values) {

        let value = values[key]
        temp[key] = value

        if (this.categoryOptions[key] === undefined) {
          this.categoryOptionsArr.push(key)
          this.categoryOptions[key] = [];
        } else if (value !== null && !this.categoryOptions[key].includes(value)) {
          this.categoryOptions[key].push(value)
        }

      }
      this.annData[rowName] = temp
    }

    //find the number of overlay categories in order to calculate the margin needed for the graph
    let categoryCount = 0;
    for (let index in this.categoryOptions) {
      let isNumber = true;
      for (let i = 0; i < this.categoryOptions[index].length; i++) {
        if (isNaN(this.categoryOptions[index][i])) {
          isNumber = false;
        }
      }
      if (isNumber) {
        categoryCount++;
      } else if (
        (this.categoryOptions[index].length <= this.maximumCategoricalLevels)
        &&
        (this.categoryOptions[index].length > 1)
      ) {
        categoryCount++;
      }
    }
    return categoryCount;
  }

  textTooSmallWarning(label) {
    let message = `There are too many ${label} to clearly show labels. Disabling.`;
    this.notificationService.warn(message, 5000);
    if (label === this.featuresLabel){
      this.showFeatureLabels = false;
      this.f['imgFeatureLabels'].setValue(false);
    } else {
      this.showObsLabels = false;
      this.f['imgObsLabels'].setValue(false);
    }
  }

  sendAlertMessage() {
    console.log('in send alert...categoryToIgnore=', this.categoryToIgnore);
    let ignoreMessage = '';
    for (let i = 0; i < this.categoryToIgnore.length - 1; i++) {
      console.log('in send alert, ', this.categoryToIgnore[i]);
      ignoreMessage += this.categoryToIgnore[i] + ", "
    }
    let lastIndex = this.categoryToIgnore.length - 1;
    ignoreMessage += this.categoryToIgnore.length > 1 ? "and " + this.categoryToIgnore[lastIndex] + "." : this.categoryToIgnore[lastIndex] + ".";

    let message = "These annotation categories will not be displayed because they are either too large or too small to effectively color code: " + ignoreMessage
    this.notificationService.warn(message, 2000);
  }

  scrollTo(htmlID) {
    const element = document.getElementById(htmlID) as HTMLElement;
    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }

  removeOverlay(category) {
    this.removeOverlayArray.push(category)
    this.createHeatmap()
  }

  calculateLegendAllocation(include_all) {
    // in this function, we don't care about the categories
    // that the user may have removed. We just want to calculate
    // the maximum space we need for all potential legend markers
    let totalHeight = 0;
    for (let index of this.categoryOptionsArr) {
      if (!include_all && this.removeOverlayArray.includes(index)) {
        continue
      }
      let catOptions = this.categoryOptions[index];
      let isNumber = this.isNumericScale(catOptions);
      if (isNumber) {
        totalHeight += this.gradientLegendTypeHeight;
      } else if (this.categoryOptions[index].length <= this.maximumCategoricalLevels
        && this.categoryOptions[index].length > 1) {
        totalHeight += (catOptions.length * this.categoricalLegendMarkerSpacing) + 20;

      }
    }
    return totalHeight;
  }
}
