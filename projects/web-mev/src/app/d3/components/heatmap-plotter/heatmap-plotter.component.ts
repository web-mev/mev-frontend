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
  gradientLegendTypeHeight = 100;

  // for legends corresponding tocategorical displays,
  // only show up to this many levels
  maximumCategoricalLevels = 6;

  gradientMinColor = 'royalblue';
  gradientMaxColor = 'crimson';

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

  setTileSizes(xScale, yScale){

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
    let annotationPadding = categoryCount * this.heightCategory + 20;

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
    if (this.showFeatureLabels || this.showObsLabels){
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
    if (allFeatures.length >= orderedObservations.length){
      // more features than observations. Hence, each row
      // corresponds to a feature and each column is a row
      this.orientation = this.samplesInColumnsKey;
      this.margin.top = annotationPadding;

      // using the font size and longest labs, give a rough size for the 
      // room necessary to show those labels
      if (this.showFeatureLabels){
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
      if (tmpTileWidth > this.targetTileSize){
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
      if (tmpTileHeight > this.targetTileSize){
        tmpTileHeight = this.targetTileSize;
      } else if (tmpTileHeight < this.minTileSize){
        // if the tiles are too small in height, increase their size
        tmpTileHeight = this.minTileSize;
      }

      // now, given the tile height, adjust the this.outerHeight, since we
      // can afford to scroll
      this.outerHeight = tmpTileHeight * allFeatures.length + this.margin.top + this.margin.bottom;


    } else {

      this.orientation = this.samplesInRowsKey;
      if (this.showFeatureLabels){
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
      this.margin.left = annotationPadding + obsLabelWidth;

      // the available width after taking the "extra" stuff into account:
      let tmpHeatmapWidth = this.outerWidth - annotationLegendWidth - this.margin.left;
      let tmpHeatmapHeight = this.outerHeight - this.margin.bottom;
      let tmpTileWidth = tmpHeatmapWidth / allFeatures.length;
      let tmpTileHeight = tmpHeatmapHeight / orderedObservations.length;
      if (tmpTileWidth > this.targetTileSize){
        tmpTileWidth = this.targetTileSize;
      }
      if (tmpTileHeight > this.targetTileSize){
        tmpTileHeight = this.targetTileSize;
      } else if (tmpTileHeight < this.minTileSize){
        tmpTileHeight = this.minTileSize;
      }
      // now, given the tile height, adjust the this.outerHeight, since we
      // can afford to scroll
      this.outerHeight = tmpTileHeight * orderedObservations.length + this.margin.top + this.margin.bottom;
      this.margin.right = this.outerWidth - tmpTileWidth * allFeatures.length - this.margin.left;

    }
    // TODO: uncomment when ready
    //this.f['imgOrientation'].setValue(this.orientation);

    //this.margin.bottom = xAxisLength <= 25 ? 200 : 50;

    console.log('AFTER:');
    console.log(this.margin);
    console.log(this.outerWidth, this.outerHeight);
  

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

    let tileX, tileY;
    [tileX, tileY ]= this.setTileSizes(xScale, yScale);

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

    let graphHeight = this.resourceData.length * tileY; //height of actual graph portion only

    //category overlay
    let tempAnnotations = { ...this.annData }
    let colorRange = ["#ac92eb", "#4fc1e8", "#a0d568", "#ffce54", "#ed5564", "#feb144"];
    let catOptions = [];
    let count = 0; //Keeps track of overlay items for the legends for y position and overall number of overlay items
    let spacer = 0;
    if (this.orientation === this.samplesInColumnsKey){
      spacer = this.margin.top - 30; //30 is the height of the space between graph and overlay
    } else {
      spacer = 10;
    }
    let catYLocation = 0;

    console.log('this.categoryOptions');
    console.log(this.categoryOptions);
    if (this.hideOverlay === false) {
      let annotationOverlay = svg.append('g');
      // just for overlays
      for (let index of this.categoryOptionsArr) {
        console.log(`look at ${index}`)
        let isNumber = this.isNumericScale(this.categoryOptions[index]);

        //If all values are numbers, will use a gradient
        if (isNumber && !this.removeOverlayArray.includes(index)) {
          let min = Math.trunc(Math.floor(Math.min(...this.categoryOptions[index])))
          let max = Math.trunc(Math.ceil(Math.max(...this.categoryOptions[index])))
          console.log(`gradient with count=${count}`);
          if (min !== max) {
            catOptions = this.categoryOptions[index]

            // Build color scale
            var myColor = d3.scaleLinear()
              .range([this.gradientMinColor, this.gradientMaxColor])
              .domain([min, max])

            if (tempAnnotations[orderedObservations[0]] !== undefined) {
              annotationOverlay.selectAll()
                .data(orderedObservations)
                .join("rect")
                .attr("x", d => {
                  if (this.orientation === this.samplesInColumnsKey){
                    return xScale(d)
                  }
                  return count * this.heightCategory
                })
                .attr("y", d =>{
                  if (this.orientation === this.samplesInColumnsKey){
                    return spacer - count * this.heightCategory
                  }
                  return yScale(d)
                })
                .attr("width", d => {
                  if (this.orientation === this.samplesInColumnsKey){
                    return xScale.bandwidth() - 0.4
                  }
                  return this.heightCategory - 0.4
                })
                .attr("height", d => {
                  if (this.orientation === this.samplesInColumnsKey){
                    return this.heightCategory - 0.4
                  }
                  return yScale.bandwidth() - 0.4
                })
                .style("fill", d => {
                  return tempAnnotations[d] !== undefined ? myColor(tempAnnotations[d][index]) : 'black'
                })
                .on('mouseover', function (mouseEvent: any, d) {
                  pointTipOverlay.show(mouseEvent, d, tempAnnotations[d][index], index, this);
                  pointTipOverlay.style('left', mouseEvent.x + tooltipOffsetX + 'px');
                })
                .on('mouseout', pointTipOverlay.hide);
            }
            count++;
          } else {
            this.categoryToIgnore.push(index.replace(/_/g, " "))
          }

        }
        //For use if values are categorical
        else if (this.categoryOptions[index].length <= this.maximumCategoricalLevels 
                && this.categoryOptions[index].length > 1 
                && !this.removeOverlayArray.includes(index)) {

          catOptions = this.categoryOptions[index]
          var testScaleColor = d3.scaleOrdinal()
            .range(colorRange)
            .domain(catOptions)
          console.log(`category with count=${count}`);
          if (tempAnnotations[orderedObservations[0]] !== undefined) {
            annotationOverlay.selectAll()
              .data(orderedObservations)
              .join("rect")
              .attr("x", d => {
                if (this.orientation === this.samplesInColumnsKey){
                  return xScale(d)
                }
                return count * this.heightCategory
              })
              .attr("y", d=> {
                if (this.orientation === this.samplesInColumnsKey){
                  return spacer - count * this.heightCategory
                }
                return yScale(d)
              })
              .attr("width", d => {
                if (this.orientation === this.samplesInColumnsKey){
                  return xScale.bandwidth() - 0.4
                }
                return this.heightCategory - 0.4
              })
              .attr("height", d => {
                if (this.orientation === this.samplesInColumnsKey){
                  return this.heightCategory - 0.4
                }
                return yScale.bandwidth() - 0.4
              })
              .style("fill", function (d) {
                return tempAnnotations[d] !== undefined ? testScaleColor(tempAnnotations[d][index]) : 'black'
              })
              .on('mouseover', function (mouseEvent: any, d) {
                pointTipOverlay.show(mouseEvent, d, tempAnnotations[d][index], index, this);
                pointTipOverlay.style('left', mouseEvent.x + tooltipOffsetX + 'px');
              })
              .on('mouseout', pointTipOverlay.hide);
          }
          count++;
        }
        //categories not to display
        else if (this.categoryOptions[index].length > 6 || this.categoryOptions[index].length <= 1) {
          this.categoryToIgnore.push(index.replace(/_/g, " "))
        }
      }

      //let graphWidth = this.xAxisArr.length * xScale.bandwidth(); // gives how wide for just the heatmap
      let legendPadding = 10; // space between heatmap area and annotations

      //just for legends
      let legendOverlay = svg.append('g')
        .attr("transform", `translate(${heatmapWidth + this.margin.left + legendPadding + 20}, 0)`);
      let reverseCategoryOptions = this.categoryOptionsArr.slice().reverse();
      console.log('RC: ', reverseCategoryOptions);
      for (let categoryIdxNum in reverseCategoryOptions) {
        console.log('CI: ', categoryIdxNum);
        let index = reverseCategoryOptions[categoryIdxNum];
        if(Number(categoryIdxNum) > 1){ // cast since compiler was complaining for some reason...
          catYLocation += 20;
        }
        console.log('INDEX: ', index);
        let isNumber = true;
        for (let i = 0; i < this.categoryOptions[index].length; i++) {
          if (isNaN(this.categoryOptions[index][i])) {
            isNumber = false
          }
        }

        if (isNumber && !this.removeOverlayArray.includes(index)) {
          let min = Math.trunc(Math.floor(Math.min(...this.categoryOptions[index])))
          let max = Math.trunc(Math.ceil(Math.max(...this.categoryOptions[index])))
          if (min !== max) {

            //Gradient legend
            catYLocation += 40;
            var correlationColorData = [{ "color": "royalblue", "value": min }, { "color": "crimson", "value": max }];
            var extent = d3.extent(correlationColorData, d => d.value);

            var paddingGradient = 10;
            var widthGradient = this.annotationLegendMinWidth;
            var innerWidth = widthGradient - (paddingGradient * 2);
            var barHeight = 8;

            var xScaleCorr = d3.scaleLinear()
              .range([0, innerWidth - 100])
              .domain(extent);

            let xTicksCorr = [min, max];

            var xAxisGradient = d3.axisBottom(xScaleCorr)
              .tickSize(barHeight * 2)
              .tickValues(xTicksCorr);

            var gradientLegend = legendOverlay
              .append("svg")
              .attr("width", widthGradient)
              //.attr("height", this.gradientLegendTypeHeight)
              .attr('x', 0)
              .attr('y', catYLocation)

            var defs = gradientLegend.append("defs");
            var linearGradient = defs
              .append("linearGradient")
              .attr("id", "myGradient");

            linearGradient.selectAll("stop")
              .data(correlationColorData)
              .enter().append("stop")
              .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
              .attr("stop-color", d => d.color)

            var g = gradientLegend.append("g")
              .attr("transform", `translate(${paddingGradient + 10}, 30)`)

            g.append("rect")
              .attr("width", innerWidth - 100)
              .attr("height", barHeight)
              .style("fill", "url(#myGradient)");

            let gradientNode = gradientLegend.append('text')
              .attr('x', 0)
              .attr('y', 15)
              .attr("class", index)
              .style('fill', 'rgba(0,0,0,.7)')
              .style('font-size', '10px')
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .text(index.replace(/_/g, " ").toUpperCase())

            gradientLegend.append('text')
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

            gradientLegend.append('text')
              .attr('x', gradientNode.node().getComputedTextLength() + 5)
              .attr('y', 15)
              .attr("class", "closePointer")
              .style('fill', 'rgba(0,0,0,.7)')
              .style('font-size', '10px')
              .style('font-weight', 'bold')
              .text("ⓘ")
              .on("click", () => {
                this.removeOverlay(index)
              })
              .on('mouseover', function (mouseEvent: any, d) {
                legendInfoTip.show(mouseEvent, d, this);
                legendInfoTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
              })
              .on('mouseout', legendInfoTip.hide);

            g.append("g")
              .call(xAxisGradient)
              .select(".domain")

            catYLocation += 60;
          }
        }
        else if (this.categoryOptions[index].length <= this.maximumCategoricalLevels && this.categoryOptions[index].length > 1 && !this.removeOverlayArray.includes(index)) {
          catOptions = this.categoryOptions[index];
          let colorRange = ["#ac92eb", "#4fc1e8", "#a0d568", "#ffce54", "#ed5564", "#feb144"];
          var testScaleColor = d3.scaleOrdinal()
            .range(colorRange)
            .domain(catOptions)

          // select the svg area
          var CategoryLegend = legendOverlay
            .append("svg")
            .attr('x', 0)
            .attr('y', catYLocation)

          console.log('Beofre incrementing...')
          console.log(catYLocation, catOptions);
          catYLocation += (catOptions.length * 27) + 20 //height of each row and space between the legends 
          console.log('After incrementing...')
          console.log(catYLocation);

          // Add one dot in the legend for each name.
          CategoryLegend.selectAll("mydots")
            .data(catOptions)
            .enter()
            .append("circle")
            .attr("cx", 10)
            .attr("cy", function (d, i) { return 100 + i * 20 }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 5)
            .style("fill", d => {
              return testScaleColor(d)
            })

          // Add one dot in the legend for each name.
          CategoryLegend.selectAll("mylabels")
            .data(catOptions)
            .enter()
            .append("text")
            .attr("x", 20)
            .attr("y", function (d, i) { return 100 + i * 20 }) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", "rgba(0,0,0,.7)")
            .style('font-size', '8px')
            .text(function (d) {
              return d
            })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")

          CategoryLegend.append('text')
            .attr('x', 0)
            .attr('y', 85)
            .style('fill', 'rgba(0,0,0,.7)')
            .style('font-size', '10px')
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(index.replace(/_/g, " ").toUpperCase())

          CategoryLegend.append('text')
            .attr('x', this.annotationLegendMinWidth - 20)
            .attr('y', 85)
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
      }
    }

    if (catYLocation > this.outerHeight) {
      console.log('Exceeded!!!:', catYLocation, this.outerHeight);
      this.outerHeight = catYLocation + 100;
      this.yLocationLengend = catYLocation;
      //this.createHeatmap();
    } else {
      console.log('did not exceed:', catYLocation, this.outerHeight);
    }

    selection
      .exit()
      .remove();

    if (this.showObsLabels || this.showFeatureLabels) {
      let axesContainer = svg.append('g');

      if (this.showObsLabels) {
        if (obsAxis === 'x') {
          if (this.xAxisArr.length <= 25) {
            axesContainer.append('g')
              .call(d3.axisBottom(xScale))
              .attr('transform', 'translate(0,' + (this.margin.top + heatmapHeight) + ')')
              .selectAll('text')
              .attr("y", 6)
              .attr("x", -10)
              .attr("transform", "rotate(-45)")
              .style("text-anchor", "end")
              .style("font-size", `${this.tickLabelFontSize}px`)
          } else {
            let message = "There are too many observations to clearly show labels. Disabling.";
            this.notificationService.warn(message, 5000);
            this.showObsLabels = false;
          }

        } else {
          if (this.resourceData.length <= 25) {
            axesContainer.append('g')
              .call(d3.axisLeft(yScale))
              .attr('transform', 'translate(' + this.margin.left + ', 0 )')
              .style("font-size", `${this.tickLabelFontSize}px`);
          }
        }

      }

      if (this.showFeatureLabels) {
        if (this.heatmapData.length > 25) {
          console.log('TOO MANY!!!!!!');
          let message = "There are too many genes/features to clearly show labels. Disabling.";
          this.notificationService.warn(message, 5000);
          this.showFeatureLabels = false;
        }
        else {
          if (featureAxis === 'x') {
            if (this.xAxisArr.length <= 25) {
              axesContainer.append('g')
                .call(d3.axisBottom(xScale))
                .attr('transform', 'translate(0,' + (this.margin.top + heatmapHeight) + ')')
                .selectAll('text')
                .attr("y", -4)
                .attr("x", 9)
                .attr("transform", "rotate(90)")
                .style("text-anchor", "start")
                .style("font-size", `${this.tickLabelFontSize}px`)
            }
          } else {
            if (this.resourceData.length <= 25) {
              axesContainer.append('g')
                .call(d3.axisLeft(yScale))
                .attr('transform', 'translate(' + this.margin.left + ', 0 )')
                .style("font-size", `${this.tickLabelFontSize}px`);
            }
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
      } else if (this.categoryOptions[index].length <= 6 && this.categoryOptions[index].length > 1) {
        categoryCount++;
      }
    }

    //let xAxisLength = Object.keys(this.resourceData[0].values).length;
    //let yAxisLength = this.resourceData.length;
    //this.margin.left = yAxisLength <= 25 ? 100 : 50;
    //this.margin.bottom = xAxisLength <= 25 ? 200 : 50;
    //this.margin.top = categoryCount * this.heightCategory + 20;
    // this.isWait = false;
    //this.createHeatmap();
    return categoryCount;
  }

  sendAlertMessage() {
    let ignoreMessage = '';
    for (let i = 0; i < this.categoryToIgnore.length - 1; i++) {
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

}
