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
  @Input() hasResourceChanged;
  @Input() featureLabel;
  @Input() obsLabel;
  @Input() valueLabel;

  @ViewChild('heatmap')
  svgElement: ElementRef;

  @ViewChild(MatExpansionPanel) plotOptionsPanel: MatExpansionPanel;

  customObservationSets = [];
  customObservationSetsToPlot = [];
  heatmapData = [];
  plotReady = false;
  tilesTooSmall = false;
  validPlot = false;
  imgAdjustForm: FormGroup;
  panelOpenState = false;

  windowWidth;
  windowHeight;

  // heatmap settings
  tickLabelFontSize = 8;

  // used for estimating the space required for text.
  // e.g. (num of chars) * fontsize * fontScaleFactor
  fontScaleFactor = 0.8

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

  heightCategory = 12; //height of individual category overlay
  annotationOverlayPadding = 20;

  // a variable which holds the size of
  // the space taken up by the annotation tiles.
  // basically N * heightCategory where N is the
  // number of annotation covariates
  annotationPadding;

  featuresLabel = 'genes/features';
  observationsLabel = 'observations/samples';

  imageName = 'heatmap'; // file name for downloaded SVG image
  precision = 2;
  outerHeight;
  outerWidth;
  targetTileSize = 40; // a reasonable default tile size to aim for
  minTileSize = 2; // originally set to 5
  tooltipOffsetX = 10; // to position the tooltip on the right side of the triggering element

  // defaults for the form
  defaultObsLabels = true;
  defaultFeatureLabels = false;
  defaultSquareTiles = false;
  defaultLogScale = false;

  showObsLabels = this.defaultObsLabels; //whether to label the obs
  showFeatureLabels = this.defaultFeatureLabels; //whether to label the features
  logScale = this.defaultLogScale;
  categoryOptions = {};
  categoryOptionsArr = [];
  margin;
  containerId = '#heatmap';
  // for common reference when determining the orientation of the heatmap
  samplesInColumnsKey = '__SIC__';
  samplesInRowsKey = '__SIR__';
  samplesInColumnsText = 'Samples/observations in columns';
  samplesInRowsText = 'Samples/observations in rows';
  squareTiles = this.defaultSquareTiles; //if true, then the tiles will be squares
  orientation; // the current orientation (e.g. samples in columns)

  // the 'default' orientation (which makes the heatmap into portrait mode)
  // We give a default value so that the 'adjustment form' has a value to work with.
  // However, we quickly reset the value to be consistent with the data. This is just
  // so the radio button in the form has *something* to work with.
  naturalOrientation = this.samplesInColumnsKey;

  // a key which indicates the user has not selected an orientation and
  // that we should use the 'natural' orientation
  orientationUnspecified = '__ORIENTATION_UNSPECIFIED__';

  colormapOptions = {
    'Brown-blue-green': d3.interpolateBrBG,
    'Purple-green': d3.interpolatePRGn,
    'Purple-orange': d3.interpolatePuOr,
    // note that we label it as Blue-red, even though it's Red-blue.
    // Below, we manipulate the plotted values so that blue corresponds
    // to low expression.
    'Blue-red': d3.interpolateRdBu,
    'Red-yellow-blue': d3.interpolateRdYlBu,
    'Viridis': d3.interpolateViridis,
    'Ciridis': d3.interpolateCividis,
    'Lioness': d3.interpolateRgb("blue", "white", "red")
  }
  colormapList = Object.keys(this.colormapOptions);
  defaultColormap = 'Blue-red';
  selectedColormap = '';
  annData = {};
  categoryToIgnore = [];
  removeOverlayArray = [];
  hideOverlay = false;

  ignoredCategoriesWarningMessage = '';

  constructor(
    private metadataService: MetadataService,
    private formBuilder: FormBuilder,
    private readonly notificationService: NotificationService
  ) {
    this.imgAdjustForm = this.formBuilder.group({
      'imgAspectRatio': ['', ''],
      'imgObsLabels': [this.showObsLabels, ''],
      'imgFeatureLabels': [this.showFeatureLabels, ''],
      'logScale': [this.logScale, ''],
      'colormaps': [this.defaultColormap, ''],
      'imgOrientation': [this.naturalOrientation, ''],
    })
  }

  ngOnInit(): void {
    this.windowWidth = window.innerWidth - 500;
    this.windowHeight = window.innerHeight

    this.customObservationSets = this.metadataService.getCustomObservationSets();

    this.generateHeatmap(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.heatmapData = this.resourceData;
    this.generateHeatmap(true);
  }

  resetAdjustmentForm() {

    // set the form fields
    this.f['imgObsLabels'].setValue(true);
    this.f['imgFeatureLabels'].setValue(false);
    this.f['imgAspectRatio'].setValue(false);
    this.f['logScale'].setValue(false);
    this.f['colormaps'].setValue(this.defaultColormap);
    this.f['imgOrientation'].setValue(this.naturalOrientation);

    // set the variables back to their defaults:
    this.showObsLabels = this.defaultObsLabels;
    this.showFeatureLabels = this.defaultFeatureLabels;
    this.squareTiles = this.defaultSquareTiles;
    this.selectedColormap = this.defaultColormap;
    this.orientation = this.orientationUnspecified;
    this.logScale = this.defaultLogScale;
  }

  generateHeatmap(fullRefresh) {

    //reset variables when changing resources
    if (this.hasResourceChanged && fullRefresh) {
      this.removeOverlayArray = [];
      this.annData = {};
    }

    if (fullRefresh) {
      this.resetAdjustmentForm();
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

    this.orientation = this.imgAdjustForm.value['imgOrientation'];

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

    this.generateHeatmap(false);
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

    // reset some items:
    this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
    this.ignoredCategoriesWarningMessage = '';

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
    this.annotationPadding = categoryCount * this.heightCategory + (categoryCount > 0 ? this.annotationOverlayPadding : 0);

    let annotationLegendWidth = this.hideOverlay ? 0 : this.annotationLegendMinWidth;

    this.categoryToIgnore = [];

    // reformat the data so it's easier to work with in d3
    let [reformattedData, allFeatures, orderedObservations, minVal, maxVal] = this.reformatData();

    // to get an estimate for the size of the observation and feature labels, get the maximum length
    // of the strings for each:
    let longestObsName = Math.max(...orderedObservations.map(x => x.length));
    let longestFeatureName = Math.max(...allFeatures.map(x => x.length));
    let featureNameAllocation = this.fontScaleFactor * this.tickLabelFontSize * longestFeatureName;
    let obsNameAllocation = this.fontScaleFactor * this.tickLabelFontSize * longestObsName;

    // get the default orientation of the heatmap-- users CAN override this.
    // by default, orient the heatmap such that it has a portrait
    // orientation. Vertical scrolls are fine, but horizontal makes 
    // other page elements look poor
    if (allFeatures.length >= orderedObservations.length) {
      // more features than observations. Hence, each row
      // corresponds to a feature and each column is a row
      this.naturalOrientation = this.samplesInColumnsKey;
    } else {
      this.naturalOrientation = this.samplesInRowsKey;
    }

    if (this.orientation === this.orientationUnspecified) {
      this.orientation = this.naturalOrientation;
    }

    // set the value in the form so it's consistent with 
    // the orientation of the heatmap itself
    this.f['imgOrientation'].setValue(this.orientation);

    // Get the tile size with and without the axis labeled
    let rowLabelsOn, columnLabelsOn, tx1, tx2;
    if (this.orientation === this.samplesInColumnsKey) {
      rowLabelsOn = this.showFeatureLabels;
      columnLabelsOn = this.showObsLabels;

      // regardless of whether we end up labeling, calculate the tile
      // size with and without the row labels.
      // First without:
      let tmpHeatmapWidth = this.outerWidth - annotationLegendWidth - this.annotationPadding;
      tx2 = tmpHeatmapWidth / orderedObservations.length;
      // and with labeling:
      tmpHeatmapWidth -= featureNameAllocation;
      tx1 = tmpHeatmapWidth / orderedObservations.length;
    } else { // samples in rows
      rowLabelsOn = this.showObsLabels;
      columnLabelsOn = this.showFeatureLabels;

      // regardless of whether we end up labeling, calculate the tile
      // size with and without the row labels.
      // First without:
      let tmpHeatmapWidth = this.outerWidth - annotationLegendWidth - this.annotationPadding;
      tx2 = tmpHeatmapWidth / allFeatures.length;
      // and with labeling:
      tmpHeatmapWidth -= obsNameAllocation;
      tx1 = tmpHeatmapWidth / allFeatures.length;
    }

    // if the tile size without labels is still too small 
    // to view, then immediately bail.
    if (tx2 < this.minTileSize) {
      this.validPlot = false;
      this.notificationService.warn('Even with removing labeling, we cannot display' 
                                     + ' the heatmap since the tile size is too small.'
                                     + ' Try again with different settings.', 5000);
      return;
    }
    if (tx2 > this.targetTileSize){
      tx2 = this.targetTileSize;
    }
    if (tx1 > this.targetTileSize){
      tx1 = this.targetTileSize;
    }

    let tileX, tileY;
    if (this.squareTiles) {
      if (rowLabelsOn) {
        tileX = tileY = tx1;
      } else {
        tileX = tileY = tx2;
      }
      if (tileX < this.tickLabelFontSize) {
        columnLabelsOn = false;
        rowLabelsOn = false;
        tileX = tileY = tx2;
        this.notificationService.warn('Note that we needed to remove' 
        + ' labeling since it would not be displayed clearly.', 5000);
      }
    } else {
      if (rowLabelsOn) {
        tileX = tx1;
      } else {
        tileX = tx2;
      }
      tileY = 1.5 * this.tickLabelFontSize;
      if ((tileX < this.tickLabelFontSize) && columnLabelsOn) {
        columnLabelsOn = false;
        this.notificationService.warn('Note that we needed to remove the column' 
                  + ' labeling since it would not be displayed clearly.', 5000);
      }
    }

    // depending on whether the labels would fit, we might 
    // have turned off the labeling-- reset the global vars here
    if (this.orientation === this.samplesInColumnsKey) {
      this.showObsLabels = columnLabelsOn;
      this.showFeatureLabels = rowLabelsOn;
    } else { // samples in rows
      this.showObsLabels = rowLabelsOn;
      this.showFeatureLabels = columnLabelsOn;
    }

    // round-up tileX and tileY so they're integers
    tileX = Math.ceil(tileX);
    tileY = Math.ceil(tileY);

    // now we can set the margins:
    let heatmapHeight, heatmapWidth;
    if (this.orientation === this.samplesInColumnsKey) {

      this.margin.top = this.annotationPadding;

      // using the font size and longest labs, give a rough size for the 
      // room necessary to show those labels
      if (this.showFeatureLabels) {
        this.margin.left = featureNameAllocation;
      }
      if (this.showObsLabels) {
        this.margin.bottom = obsNameAllocation;
      }

      // now, given the tile height, adjust the this.outerHeight, since we
      // can afford to scroll
      heatmapHeight = tileY * allFeatures.length;
      heatmapWidth = tileX * orderedObservations.length;
    } else { // samples in rows

      if (this.showFeatureLabels) {
        this.margin.bottom = featureNameAllocation;
      }
      this.margin.left = this.annotationPadding;
      if (this.showObsLabels) {
        this.margin.left += obsNameAllocation;
      }
      heatmapHeight = tileY * orderedObservations.length;
      heatmapWidth = tileX * allFeatures.length;
    }

    // make a minor adjustment to the right margin now that we have the heatmapWidth and left margin
    this.margin.right = this.outerWidth - this.margin.left - heatmapWidth;

    // given how we set tileY, we might have increased the vertical space allocation beyond
    // the original outerHeight. Re-set based on the calculated margins:
    this.outerHeight = heatmapHeight + this.margin.top + this.margin.bottom;

    // if there are many legend elements, it can be larger than the heatmap itself 
    // and run off the bottom if we don't increase outerHeight. Calculate the size
    // needed for the largest possible legend and adjust the outerHeight if required
    let totalLegendAllocation = this.calculateLegendAllocation(true);
    if (totalLegendAllocation > this.outerHeight) {
      this.outerHeight = totalLegendAllocation + 10;
    }

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

    // to make sure everything lines up perfectly, "reset" the tileX/Y using the scale's bandwidth:
    tileX = xScale.bandwidth();
    tileY = yScale.bandwidth();

    if ((tileX < this.minTileSize) || (tileY < this.minTileSize)) {
      this.tilesTooSmall = true;
      this.validPlot = false;
      return
    } else {
      this.tilesTooSmall = false;
    }

    // tool tip for individual points (if displayed)
    const pointTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        let tipBox = `<div><div class="category">${this.featureLabel}:</div> ${d.featureId}</div>
                      <div><div class="category">${this.obsLabel}: </div> ${d.obsId}</div>
                      <div><div class="category">${this.valueLabel}: </div>${d.value.toFixed(this.precision)}</div>`
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
      .attr('style', 'overflow: visible;')
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

    // let lionessColor = d3.scaleLinear()
    //   .range(["royalblue", "#fffafa", "crimson"])
    //   .domain([minVal, 0, maxVal])

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
        let scaledVal = (dataValue - minVal) / (maxVal - minVal);
        // The 'Blue-red' colormap is actually a Red-blue map (which is made available by D3.js)
        // However, high expression values of blue (and low for red) is unconventional since we
        // typically associate "warm" colors with higher values. Thus, we use the "Red-blue" colormap
        // and "flip" the value we plot.
        if(this.selectedColormap === 'Blue-red'){
          scaledVal = 1-scaledVal;
        }
        return colormapInterpolator(scaledVal)

        //for lioness
        //return lionessColor(dataValue)
      })
      .on('mouseover', function (mouseEvent: any, d) {
        pointTip.show(mouseEvent, d, this);
        pointTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
      })
      .on('mouseout', pointTip.hide);

    selection
      .exit()
      .remove();

    // Category and legend overlay
    // This avoids issues of scope with closures below-- 
    let tempAnnotations = { ...this.annData }
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

    if (this.hideOverlay === false) {

      // this holds the graphical overlay of the annotations
      // that lines up with the heatmap
      let annotationOverlay = svg.append('g');

      // this holds the legend for the annotations
      let legendOverlay = svg.append('g')
        .attr("transform", `translate(${heatmapWidth + this.margin.left + legendPadding}, 0)`);

      // iterate through the annotation categories, adding the visuals and legend
      for (let numericalCatIndex in this.categoryOptionsArr) {
        let index = this.categoryOptionsArr[numericalCatIndex];
        let isNumber = this.isNumericScale(this.categoryOptions[index]);

        let catLegend, legendTitleNode;
        if (!this.removeOverlayArray.includes(index)) {
          // create the common elements for the legends (like title, the "X" close button, etc.)
          catLegend = legendOverlay.append("svg")
            .attr('x', 0)

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
            .attr('x', this.annotationLegendMinWidth - 30)
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

          //If all values are numbers, will use a gradient
          if (isNumber && !this.removeOverlayArray.includes(index)) {
            let min = Math.trunc(Math.floor(Math.min(...this.categoryOptions[index])))
            let max = Math.trunc(Math.ceil(Math.max(...this.categoryOptions[index])))

            if (min !== max) {
              // Build color scale for colored annotation boxes:
              var annotationColorScale = d3.scaleLinear()
                .range([this.gradientMinColor, this.gradientMaxColor])
                .domain([min, max])
            } else {
              var annotationColorScale = (x) => "rgba(0,0,0,0.5)"
            }

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

            if (min !== max) {
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
            } else {
              let gradientColorbarGroup = catLegend.append("g")
                .attr("transform", `translate(${this.gradientBarPadding + 10}, 30)`);
              let innerWidth = this.annotationLegendMinWidth - (this.gradientBarPadding * 2);
              gradientColorbarGroup.append("rect")
                .attr("width", innerWidth - 100)
                .attr("height", this.gradientBarHeight)
                .style("fill", "rgba(0,0,0,0.5");
              gradientColorbarGroup.append("text")
                .attr("x", 0.5 * (innerWidth - 100))
                .attr("y", 20)
                .style("fill", "rgba(0,0,0,.7)")
                .style('font-size', '8px')
                .text(`(All values = ${min})`)
                .attr("text-anchor", "middle")
                .style("alignment-baseline", "middle")
            }
            catYLocation -= this.gradientLegendTypeHeight;
            catLegend.attr('y', catYLocation)
          }
          //For use if values are categorical
          else if (this.categoryOptions[index].length <= this.maximumCategoricalLevels
            && this.categoryOptions[index].length > 1
            && !this.removeOverlayArray.includes(index)) {

            catOptions = this.categoryOptions[index]
            let ordinalColorScale = d3.scaleOrdinal()
              .range(colorRange)
              .domain(catOptions)

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
            this.categoryToIgnore.push(index.replace(/_/g, " "));
            catLegend.remove(); // we had created a "placeholder" title, etc. so we need to remove it.
          }
        }
      }
    }

    if (this.showObsLabels || this.showFeatureLabels) {
      let axesContainer = svg.append('g');

      if (this.showObsLabels) {
        if (obsAxis === 'x') {
          this.addXAxisLabels(axesContainer, heatmapHeight, xScale, tileX);
        } else {
          this.addYAxisLabels(axesContainer, yScale, tileY);
        }
      }

      if (this.showFeatureLabels) {
        if (featureAxis === 'x') {
          this.addXAxisLabels(axesContainer, heatmapHeight, xScale, tileX);
        } else {
          this.addYAxisLabels(axesContainer, yScale, tileY);
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

        return this.annotationPadding - this.annotationOverlayPadding - (count + 1) * this.heightCategory
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

    // acount for any categories that were removed
    return categoryCount - this.removeOverlayArray.length;
  }

  textTooSmallWarning(label) {
    let message = `There are too many ${label} to clearly show labels. Disabling.`;
    this.notificationService.warn(message, 5000);
    if (label === this.featuresLabel) {
      this.showFeatureLabels = false;
      this.f['imgFeatureLabels'].setValue(false);
    } else {
      this.showObsLabels = false;
      this.f['imgObsLabels'].setValue(false);
    }
  }

  addXAxisLabels(axesContainer, heatmapHeight, xScale, tileX) {
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
  }

  addYAxisLabels(axesContainer, yScale, tileY) {
    if (tileY > this.tickLabelFontSize) {
      axesContainer.append('g')
        .call(d3.axisLeft(yScale))
        .attr('transform', 'translate(' + this.margin.left + ', 0 )')
        .style("font-size", `${this.tickLabelFontSize}px`);
    } else {
      this.textTooSmallWarning(this.observationsLabel);
    }
  }

  sendAlertMessage() {
    let ignoreMessage = '';
    for (let i = 0; i < this.categoryToIgnore.length - 1; i++) {
      ignoreMessage += this.categoryToIgnore[i] + ", "
    }
    let lastIndex = this.categoryToIgnore.length - 1;
    ignoreMessage += this.categoryToIgnore.length > 1 ? "and " + this.categoryToIgnore[lastIndex] + "." : this.categoryToIgnore[lastIndex] + ".";

    let message = "These annotation categories will not be displayed because they are either too large or too small to effectively color code: " + ignoreMessage
    //this.notificationService.warn(message, 10000);
    this.ignoredCategoriesWarningMessage = message;
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
