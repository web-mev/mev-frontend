import { 
  Component, 
  OnInit, 
  Input,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  ɵSWITCH_IVY_ENABLED__POST_R3__
} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { FormGroup, Validators, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
//import {MatRadioModule} from '@angular/material/radio';
import {MatExpansionPanel} from '@angular/material/expansion';

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
 @Input() isWait;
 
 @ViewChild('heatmap')
 svgElement: ElementRef;

 @ViewChild(MatExpansionPanel) plotOptionsPanel: MatExpansionPanel;

 customObservationSets = [];
 customObservationSetsToPlot = [];
 heatmapData = [];
 plotReady = false;
 warnMsg = '';
 imgAdjustForm: FormGroup;
 imgAdjustFormSubmitted = false;
 panelOpenState = false;

 // heatmap settings
 imageName = 'heatmap'; // file name for downloaded SVG image
 precision = 2;
 outerHeight = 500;
 minTileSize = 20;
 tooltipOffsetX = 10; // to position the tooltip on the right side of the triggering element
 finalWidth;
 finalHeight;
 origWidth;
 origHeight;
 showObsLabels = true; //whether to label the obs
 showFeatureLabels = true; //whether to label the features
 logScale = false;
 margin = { top: 50, right: 150, bottom: 100, left: 60 }; // chart margins
 containerId = '#heatmap';
 // for common reference when determining the orientation of the heatmap
 samplesInColumnsKey = '__SIC__';
 samplesInColumnsText = 'Samples/observations in columns';
 samplesInRowsKey = '__SIR__';
 samplesInRowsText = 'Samples/observations in rows';
 squareTiles = false; //if true, then the tiles will be squares
 orientationOptions = [
   {label: this.samplesInColumnsText, key:this.samplesInColumnsKey},
   {label: this.samplesInRowsText, key:this.samplesInRowsKey},
 ];
 orientation;
 // after the user interacts with the radio, this will be true forever
 userOrientationSelected = false; 

 // after the user interacts with the sizing form, this will be true forever
 userSpecifiedSize = false;

 colormapOptions = {
   'Brown-blue-green': d3.interpolateBrBG,
   'Purple-green': d3.interpolatePRGn,
   'Purple-orange': d3.interpolatePuOr,
   'Red-blue': d3.interpolateRdBu,
   'Red-yellow-blue': d3.interpolateRdYlBu,
   'Viridis': d3.interpolateViridis,
   'Ciridis': d3.interpolateCividis
 }
 colormapList = Object.keys(this.colormapOptions);
 defaultColormap = 'Viridis';
 selectedColormap = '';

  constructor(
    private metadataService: MetadataService,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.customObservationSets = this.metadataService.getCustomObservationSets();
    let groupControlsArr = new FormArray(this.customObservationSets.map( obs => {
        return new FormControl(false);
      }
    ));
    this.imgAdjustForm = this.formBuilder.group({
      'imgWidth': ['', ''],
      'imgHeight': ['', ''],
      'imgOrientation': [this.orientation, ''],
      'imgAspectRatio': ['', ''],
      'imgObsLabels': [this.showObsLabels, ''],
      'imgFeatureLabels': [this.showFeatureLabels, ''],
      'logScale': [this.logScale, ''],
      'colormaps': [this.defaultColormap,''],
      'imgGroups': groupControlsArr
    })
    this.generateHeatmap();
  }

  ngOnChanges(): void {
    this.heatmapData = this.resourceData;
    this.generateHeatmap();
  }
  generateHeatmap() {
    if (this.svgElement){
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
    this.imgAdjustFormSubmitted = true;

    this.userSpecifiedSize = false;

    let w = this.imgAdjustForm.value['imgWidth'];
    if(w) {
      this.finalWidth = w;
      this.userSpecifiedSize = true;
    } else {
      this.finalWidth = this.origWidth;
    }
    let h = this.imgAdjustForm.value['imgHeight'];
    if(h){
      this.finalHeight = h;
      this.userSpecifiedSize = true;
    } else {
      this.finalHeight = this.origHeight;
    }

    this.orientation = this.imgAdjustForm.value['imgOrientation'];
    this.userOrientationSelected = true;

    if(this.imgAdjustForm.value['imgAspectRatio']){
      this.squareTiles = true;
    } else {
      this.squareTiles = false;
    }

    if(this.imgAdjustForm.value['imgObsLabels']){
      this.showObsLabels = true;
    } else {
      this.showObsLabels = false;
    }

    if(this.imgAdjustForm.value['imgFeatureLabels']){
      this.showFeatureLabels = true;
    } else {
      this.showFeatureLabels = false;
    }

    if(this.imgAdjustForm.value['logScale']){
      this.logScale = true;
    } else {
      this.logScale = false;
    }

    let chosenMap = this.imgAdjustForm.value['colormaps'];
    if (this.colormapList.includes(chosenMap)){
      this.selectedColormap = chosenMap;
    }

    // 
    this.panelOpenState = false;
    this.plotOptionsPanel.close();
    this.createHeatmap();
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

  createHeatmap() {

    // before doing anything, get rid of anything that may have been there
    this.clearChart();

    if(this.resourceData.length === 0){
      return
    }

    let outerWidth, outerHeight;
    if (this.userSpecifiedSize) {
      outerWidth = this.finalWidth;
      outerHeight = this.finalHeight
    } else {
      // if the user has never dictated a size
      this.origHeight = this.outerHeight;
      this.origWidth = this.svgElement.nativeElement.offsetWidth;
      outerWidth = this.origWidth;
      outerHeight = this.origHeight;
    }

    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;

    // reformat the data so it's easier to work with in d3
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
        if(idx == 0){
          allObservations = Object.keys(valueMap);

          // If the user requested plotting specific observation sets (in order!)
          // we have to rearrange the allObservations array
          if(this.customObservationSetsToPlot.length > 0){
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
          for (let [obsId, v] of Object.entries(valueMap)){
            const val = Number(v);
            if(orderedObservations.includes(obsId)){
              initVals.push(val);
            }
          }

          // set the min/max values to start
          minVal = d3.min(initVals);
          maxVal = d3.max(initVals);
        }
        for (let [obsId, v] of Object.entries(valueMap)) {
          const val = Number(v);
          if (val < minVal){
            minVal = val;
          } else if (val > maxVal){
            maxVal = val;
          }

          if(orderedObservations.includes(obsId)){
         reformattedData.push(
           {
              featureId: rowname,
              obsId: obsId,
              value: this.logScale ? Math.log2(val): val
           }
         ); 
        }
       }
      }
    );
    if(this.logScale){
      minVal = Math.log2(minVal);
      maxVal = Math.log2(maxVal);
    }

    /* To produce a reasonable initial plot, we default to plotting
    * such that the greater of genes or samples aligns with the 
    * horizontal screen axis. This section is only used if the user
    * has NEVER interacted with the radio buttons controlling the 
    * orientation. After they touch it once, it will never enter
    * this block
    */
   if(!this.userOrientationSelected){
      if (allFeatures.length > allObservations.length){
        this.orientation = this.samplesInRowsKey;
      } else {
        this.orientation = this.samplesInColumnsKey;
      }
      this.f['imgOrientation'].setValue(this.orientation);
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
    } else { // if they want the samples corresponding to rows
      yDomain = orderedObservations;
      xDomain = allFeatures;
      ySelector = 'obsId';
      xSelector = 'featureId';
      featureAxis = 'x';
      obsAxis = 'y'
    }

    // setup initial x and y scales
    let xScale = this.makeScale(xDomain, [this.margin.left, this.margin.left + width]);
    let yScale = this.makeScale(yDomain, [this.margin.top, this.margin.top + height]);

    // use the bandwidth to establish the final sizes
    let xB = xScale.bandwidth();
    let yB = yScale.bandwidth();

    let tileX, tileY;
    if(this.squareTiles){
      // set the ratio to the smaller of the two scales. Otherwise we would 
      // exceed the "natural" exterior dimensions of the figure
      if(xB <= yB){
        this.finalWidth = xB*(xDomain.length);
        this.finalHeight = xB*(yDomain.length);
        tileX = tileY = xB;
      } else {
        this.finalWidth = yB*(xDomain.length);
        this.finalHeight = yB*(yDomain.length);
        tileX = tileY = yB;
      }
    } else {
      this.finalWidth = xB*(xDomain.length);
      this.finalHeight = yB*(yDomain.length);
      tileX = xB;
      tileY = yB;
    }

    // reset the scales to the final widths/height so everything lines up well
    xScale = this.makeScale(xDomain, [this.margin.left, this.margin.left + this.finalWidth]);
    yScale = this.makeScale(yDomain, [this.margin.top, this.margin.top + this.finalHeight]);

    // tool tip for individual points (if displayed)
    const pointTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => { 
        return '(' + d.featureId + ', '+ d.obsId +'): ' +d.value.toFixed(this.precision);
       });

    const svg = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      )
      .style('fill', 'none');

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'transparent');

    const tooltipOffsetX = this.tooltipOffsetX;
    svg.call(pointTip);

    let heatmapTiles = svg.append('g');
    let selection = heatmapTiles.selectAll('rect')
      .data(reformattedData, (d) => '(' +d['obsId'] + ',' + d['featureId'] + ')');

    if(this.selectedColormap === ''){
      this.selectedColormap = this.defaultColormap;
    }
    let colormapInterpolator = this.colormapOptions[this.selectedColormap];

    selection
      .enter()
      .append('rect')
      .attr('x', d=> xScale(d[xSelector]))
      .attr('y', d=> yScale(d[ySelector]))
      .attr('height', tileY)
      .attr('width', tileX)
      .attr('fill', d => {
        return colormapInterpolator(
          (d['value'] - minVal)/(maxVal-minVal)
        )
      })
      .on('mouseover', function(mouseEvent: any, d) {
        pointTip.show(mouseEvent, d, this);
        pointTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
      })
      .on('mouseout', pointTip.hide);

    selection
      .exit()
      .remove();

    if (this.showObsLabels || this.showFeatureLabels){
      let axesContainer = svg.append('g');

      if (this.showObsLabels) {
        if (obsAxis === 'x'){
          axesContainer.append('g')
          .call(d3.axisBottom(xScale))
          .attr('transform', 'translate(0,' + (this.margin.top + this.finalHeight) + ')');
        } else {
          axesContainer.append('g')
          .call(d3.axisLeft(yScale))
          .attr('transform', 'translate('+ this.margin.left +', 0 )');
        }

      }
      if (this.showFeatureLabels){
        if (featureAxis === 'x'){
          axesContainer.append('g')
          .call(d3.axisBottom(xScale))
          .attr('transform', 'translate(0,' + (this.margin.top + this.finalHeight) + ')');
        } else {
          axesContainer.append('g')
          .call(d3.axisLeft(yScale))
          .attr('transform', 'translate('+ this.margin.left +', 0 )');
        }
      }
    }
  }

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

}
