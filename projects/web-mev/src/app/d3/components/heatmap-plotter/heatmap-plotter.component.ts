import { 
  Component, 
  OnInit, 
  Input,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { FormGroup, Validators, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { MetadataService } from '@app/core/metadata/metadata.service';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
//import {MatRadioModule} from '@angular/material/radio';
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

 customObservationSets = [];
 customObservationSetsToPlot = [];
 heatmapData = [];
 plotReady = false;
 warnMsg = '';
 imgAdjustForm: FormGroup;
 imgAdjustFormSubmitted = false;

 // heatmap settings
 imageName = 'heatmap'; // file name for downloaded SVG image
 precision = 2;
 outerHeight = 500;
 minTileSize = 20;
 finalWidth;
 finalHeight;
 origWidth;
 origHeight;
 showObsLabels = true; //whether to label the obs
 showFeatureLabels = true; //whether to label the features
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
    console.log(this.imgAdjustForm);
    console.log('????????????');

    this.userSpecifiedSize = false;

    let w = this.imgAdjustForm.value['imgWidth'];
    if(w) {
      this.finalWidth = w;
      this.userSpecifiedSize = true;
      console.log('Requested width: ', w);
    } else {
      console.log('Did not specify width');
      this.finalWidth = this.origWidth;
    }
    let h = this.imgAdjustForm.value['imgHeight'];
    if(h){
      this.finalHeight = h;
      this.userSpecifiedSize = true;
      console.log('Requested height: ', h);
    } else {
      console.log('Did not specify height');

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
    if(this.resourceData.length === 0){
      return
    }

    // before doing anything, get rid of anything that may have been there
    this.clearChart();

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
    console.log('pt0: ', outerWidth, outerHeight);

    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;
    console.log('pt1: ', width, height);

    // reformat the data so it's easier to work with in d3
    let reformattedData = [];
    let allFeatures = [];
    let allObservations = [];
    let minVal, maxVal
    this.heatmapData.forEach(
      (item, idx) => {
        let rowname = item.rowname;
        let valueMap = item.values;

        allFeatures.push(rowname);
        if(idx == 0){
          allObservations = Object.keys(valueMap);
          minVal = d3.min(Object.values(valueMap));
          maxVal = d3.max(Object.values(valueMap));
        }
        for (const [obsId, val] of Object.entries(valueMap)) {
          if (val < minVal){
            minVal = val;
          } else if (val > maxVal){
            maxVal = val;
          }
         reformattedData.push(
           {
              featureId: rowname,
              obsId: obsId,
              value: val
           }
         ); 
        }
      }
    );

    console.log('Obs:', allObservations.length);
    console.log('Features: ', allFeatures.length);

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

      console.log('samples in columns')
      // if in this orientation, the x values should
      // correspond to samples/observations
      xDomain = allObservations;
      yDomain = allFeatures;
      xSelector = 'obsId';
      ySelector = 'featureId';
      featureAxis = 'y';
      obsAxis = 'x'
    } else { // if they want the samples corresponding to rows
      console.log('samples in rows')
      yDomain = allObservations;
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
    console.log('Before adjustment, we have: (xB,yB)=', xB, yB);

    let tileX, tileY;
    if(this.squareTiles){
      // set the ratio to the smaller of the two scales. Otherwise we would 
      // exceed the "natural" exterior dimensions of the figure
      console.log('Requested squares')
      if(xB <= yB){
        console.log('horizontal dist is less. Set to XB')
        this.finalWidth = xB*(xDomain.length);
        this.finalHeight = xB*(yDomain.length);
        tileX = tileY = xB;
      } else {
        console.log('vertical dist is less. Set to yB')
        this.finalWidth = yB*(xDomain.length);
        this.finalHeight = yB*(yDomain.length);
        tileX = tileY = yB;
      }
    } else {
      console.log('unequal tiles')
      this.finalWidth = xB*(xDomain.length);
      this.finalHeight = yB*(yDomain.length);
      tileX = xB;
      tileY = yB;
    }

    // reset the scales to the final widths/height so everything lines up well
    xScale = this.makeScale(xDomain, [this.margin.left, this.margin.left + this.finalWidth]);
    yScale = this.makeScale(yDomain, [this.margin.top, this.margin.top + this.finalHeight]);

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

    let heatmapTiles = svg.append('g');
    heatmapTiles.selectAll('rect')
      .data(reformattedData)
      .enter()
      .append('rect')
      .attr('x', d=> xScale(d[xSelector]))
      .attr('y', d=> yScale(d[ySelector]))
      .attr('height', tileY)
      .attr('width', tileX)
      .attr('fill', d => {
        return d3.interpolateBrBG(
          (d['value'] - minVal)/(maxVal-minVal)
        )
      })

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

  // makeAxis(container) {
  //   return container.append('g')
  //   .call(d3.axisLeft(yScale))
  //   .attr('transform', 'translate('+ this.margin.left +', 0 )')
  // }

  /**
   * Function is triggered when resizing the chart
   */
  onResize(event) {
    //this.generateHeatmap();
  }

  onObservationCheck(e) {
    console.log('check~');
    // const sampleSet = e.source.id;
    // const foundSet = this.customObservationSets.find(
    //   el => el.name === sampleSet
    // );

    // if (e.checked) {
    //   this.customObservationSetsToPlot.push(foundSet);
    // } else {
    //   this.customObservationSetsToPlot = this.customObservationSetsToPlot.filter(
    //     set => set.name !== foundSet.name
    //   );
    // }
    // this.reformatData();
    // this.createChart();
  }

}
