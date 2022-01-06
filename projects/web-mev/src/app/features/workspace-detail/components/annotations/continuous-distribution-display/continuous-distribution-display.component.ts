import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { MetadataService } from '@app/core/metadata/metadata.service';
import { CustomSet, CustomSetType } from '@app/_models/metadata';
import { Utils } from '@app/shared/utils/utils';

import * as d3 from 'd3';
import d3Tip from 'd3-tip';

/**
 * This is a data structure that helps with the user-defined ranges
 */
class NumericRange {
    start;
    end;
    start_inclusive;
    end_inclusive;

    constructor(rangeStr: string){

        let n = rangeStr.length;

        //the string has already been validated to start with either "[" or "("
        // Set the range start inclusion accordingly
        let startChar = rangeStr.substring(0,1);
        if(startChar === '['){
            this.start_inclusive = true;
        } else {
            this.start_inclusive = false;
        }

        // the final char
        let endChar = rangeStr.substring(n-1,n);
        if(endChar === ']'){
            this.end_inclusive = true;
        } else {
            this.end_inclusive = false;
        }

        // Strip off the leading/trailing bracket/parenthesis
        rangeStr = rangeStr.substring(1,n-1);

        // The prior validation means we can split on a comma
        let strComponents = rangeStr.split(',');

        // Get the length of the two pieces. Recall that we stripped the
        // leading/trailing bracket/parentheses, but we still may have signs.
        // Regardless, we can check its numeric status using parseFloat
        try {
            this.start = parseFloat(strComponents[0]);
        } catch (error){
            throw 'The start of the range could not be parsed as a number.';
        }
        try {
            this.end = parseFloat(strComponents[1]);
        } catch (error){
            throw 'The end of the range could not be parsed as a number.';
        }

        // both not undefined.
        // Still need to check they are ordered appropriately
        if (this.start > this.end ){
            throw 'The end of the range must be greater than the beginning.';
        }
    }

    /**
     *  Returns a boolean based on whether the passed arg x is contained
     *  in the range
     */
    contains(x: number){
        let greater_than_start;
        if(this.start_inclusive){
            greater_than_start = x >= this.start
        } else {
            greater_than_start = x > this.start;
        }

        let less_than_end;
        if(this.end_inclusive){
            less_than_end = x <= this.end;
        } else {
            less_than_end = x < this.end;
        }

        if(greater_than_start && less_than_end){
            return true;
        }
        return false;
    }

    /**
     * Allows for checking if a range has already been
     * specified by the users
     */
    equals(other: NumericRange){
        let conditions = [
            this.start === other.start,
            this.end === other.end,
            this.start_inclusive === other.start_inclusive,
            this.end_inclusive === other.end_inclusive,
        ]
        return conditions.every(x => x);
    }

    /**
     * Returns a string representation of the range
     */
    toString(){
        let firstChar = this.start_inclusive ? '[' : '(';
        let finalChar = this.end_inclusive ? ']' : ')';
        return `${firstChar}${this.start},${this.end}${finalChar}`;
    }
}

@Component({
  selector: 'continuous-distribution-ann-display',
  templateUrl: './continuous-distribution-display.component.html',
  styleUrls: ['./continuous-distribution-display.component.scss']
})
export class ContinuousDistributionDisplayComponent implements OnInit {

    @Input() fieldName: string = '';
    @Input() data: any[] = [];
    @ViewChild('chipList') chipList;

    svg;
    leftBracketsGrp;
    rightBracketsGrp;
    leftParensGrp;
    rightParensGrp;
    plotGrp;
    binCountsGrp;
    binLabelsGrp;
    axisLabelGrp;

    selectedColor = 'rgba(79, 175, 219, 0.4)';
    unselectedColor = 'rgba(200,200,200,0.4)';

    containerId = '#svg-display-wrapper';

    // height and width of the SVG
    height = 200;
    width = 800;
    yc = Math.floor(this.height / 2);

    //controls the amount of jitter (and the size of the displayed brackets/parens)
    delta = 40;

    // a margin/border for the plot. Otherwise the axes will be outside the viewbox
    offset = 20;

    // when drawing a bracket denoting a closed range, this controls the size
    // of the horizontal lines on the top and bottom of the bracket
    binBracketWidth = 10;
    parenRadius = 100; // the radius of the circle used to draw the parentheses

    // this controls how far the arc is drawn.
    arcTheta = Math.asin(this.delta / this.parenRadius);

    bins;
    xScale;
    yScale;
    minX;
    maxX;
    rangeSet: NumericRange[];

    // these relate to the "pills" that show
    // the user-defined ranges
    selectable = true;
    removable = true;
    explainText = 'Specify ranges using notation like "[start,end]" where "start" and "end" are numbers. \
  An example is "[10,20]" which will create a range starting at 10 and ending at 20 (all numbers x such \
  that 10 \u2264 x \u2264 20). Note that the brackets "[" will include the endpoints while a parenthesis \
  "(" will exclude the endoint. You can use a combination of brackets and braces. For example, "[10,20)" \
  includes all numbers x such that 10 \u2264 x < 20)';

    // if we can't parse all the data (e.g. some "not reported" among a bunch of numerical data)
    // then we show this message
    dataTypeWarning = 'Some or all of the data could not be parsed as a number. As a result, the plot results \
    may be unpredictable. Most often this is caused by attempting to plot categorical data on a continuous/numerical \
    scale. Please check that the selected data is appropriate for this visualization.';
    showDataTypeWarning = false;

    dataRangeWarning = 'One or more of the endpoints from your ranges falls outside of the data limits.\
    This is not an error, but the end of your range may not be visible on the plot.';
    showDataRangeWarning = false;

    // Used to inform the user about bad range formatting, etc. in the text box where they
    // input their desired data bins/ranges
    errorMessage = '';
    rangeInputError;

    createObsSetBtnDisabled = true;

    rangeInputForm: FormGroup;

    // formats large numbers on the plot so they are easier to read
    d3NumFormat = d3.format(',');

    constructor(
        private formBuilder: FormBuilder,
        private metadataService: MetadataService
    ) { }

    ngOnInit(): void {
        this.rangeInputForm = this.formBuilder.group({
            individualRangeSpec: ['']
        });

        this.svg = d3
            .select(this.containerId)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr(
                'transform',
                'translate(' + this.offset + ',0)'
            );
        this.leftBracketsGrp = this.svg.append('g');
        this.rightBracketsGrp = this.svg.append('g');
        this.leftParensGrp = this.svg.append('g');
        this.rightParensGrp = this.svg.append('g')
        this.plotGrp = this.svg.append('g');
        this.binCountsGrp = this.svg.append('g');
        this.binLabelsGrp = this.svg.append('g');
        this.axisLabelGrp = this.svg.append('g');
        this.rangeSet = [];
        this.setupPlot();
        this.drawPts();
    }

    checkRangeSpecFormat(spec: string) {

        // We expect "math-like" notation here to specify ranges.
        // e.g. the brace "[" indicates inclusion, while "("
        // represents exclusion
        // Permits signed numbers and floats.
        // Also allows whitespace around the comma
        const regexPattern = /^[\(\[][+-]?([0-9]*[.])?[0-9]+\s*,\s*[+-]?([0-9]*[.])?[0-9]+[\)\]]$/g;
        return regexPattern.test(spec);
    }

  /**
   * Called when the user attempts to add a new range
   */
    onAddRange($event) {
        const rangeSpec = ($event.value || '').trim();
        let isValid = this.checkRangeSpecFormat(rangeSpec);
        if (isValid) {
            try {
                // create a new range instance and see if
                // it already exists
                let nr = new NumericRange(rangeSpec);
                let i = 0;
                let foundMatch = false;
                while ((i < this.rangeSet.length) && !foundMatch) {
                    if (this.rangeSet[i].equals(nr)) {
                        foundMatch = true;
                    }
                    i += 1;
                }
                if (foundMatch) {
                    throw ('This range was already specified.');
                }

                // the range is unique- save it
                this.rangeSet.push(nr);

                this.chipList.errorState = false;
                this.rangeInputError = false;
                this.rangeInputForm.controls['individualRangeSpec'].setValue('');
                this.drawBinLines();
                this.highlightPts();

            } catch (ex) {
                this.chipList.errorState = true;
                this.rangeInputError = true;
                this.errorMessage = ex;
            }
        } else {
            // we are here if the entry not a valid by our regex 
            this.chipList.errorState = true;
            this.rangeInputError = true;
            this.errorMessage = 'The range input did not match our formatting requirements. Please check your input. \
                Consult the help icon for formatting';
        }
    }

    /**
     * Called when a user clicks to remove a "pill"
     */
    remove(deletedRange) {
        console.log(deletedRange);
        // compare the string representations of the ranges to 
        // find the item in the list
        const index = this.rangeSet.map(x => x.toString()).indexOf(deletedRange.toString());

        if (index >= 0) {
            this.rangeSet.splice(index, 1);
        }
        this.drawBinLines();
        this.highlightPts();
    }

    /**
     * Establishes some basics for the plot. Called once from onInit
     */
    setupPlot() {

        // check for non-numerical types
        let found = false;
        let i = 0;
        while (!found && (i < this.data.length)) {
            if (isNaN(parseFloat(this.data[i].val))) {
                this.showDataTypeWarning = true;
                found = true; //to exit the while loop early
            }
            i += 1;
        }

        let ext = d3.extent(this.data, d => d.val);

        // keep track of the min and max data values so we can
        // warn users about ranges that are outside
        this.minX = ext[0];
        this.maxX = ext[1];

        let dataRange = this.maxX - this.minX;

        //expand the range so we don't cut off the endpoints
        let rangeLength = 1.1 * dataRange;

        let domainStart = this.minX + 0.5 * dataRange - 0.5 * rangeLength;
        let domainEnd = this.minX + 0.5 * dataRange + 0.5 * rangeLength;

        this.xScale = d3.scaleLinear()
            .domain([domainStart, domainEnd])
            .range([this.offset, this.width - this.offset]);

        this.yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.yc - this.delta / 2, this.yc + this.delta / 2]);

        this.axisLabelGrp
            .attr('transform', "translate(0," + (this.height - this.offset) + ")")
            .attr('class', 'x-axis')
            .call(d3.axisBottom(this.xScale));
    }

    /**
     * Logic for managing the scatter plot points
     * is handled here
     */
    drawPts() {
        const tip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event, d) => {
                return (d.id + ': ' + d.val);
            });
        this.svg.call(tip);

        let ptsSelection = this.plotGrp
            .selectAll('circle')
            .data(this.data);
        ptsSelection.join(
            enter => enter
                .append('circle')
                .attr('r', 5)
                .attr('fill', this.unselectedColor)
                .attr('cx', d => this.xScale(d.val))
                .attr('cy', d => this.yScale(Math.random()))
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide),
            update => update
                .append('circle')
                .attr('r', 5)
                .attr('fill', this.unselectedColor)
                .attr('cx', d => this.xScale(d.val))
                .attr('cy', d => this.yScale(Math.random()))
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
        );
    }

    /**
     * A helper function which returns a boolean
     * based on whether the value x is contained
     * in ANY of the user-defined ranges.
     */
    isInRange(x) {
        for (let r of this.rangeSet) {
            let isContainedIn = r.contains(x);
            if (isContainedIn) {
                return true;
            }
        }
        return false;
    }

    /**
     * Colors the points based on whether they fall
     * into any of the user-defined ranges
     */
    highlightPts() {
        let selCol = this.selectedColor;
        let unselCol = this.unselectedColor;

        let ptSelection = this.plotGrp
            .selectAll('circle')
            .data(this.data);

        ptSelection.join(
            enter => enter
                .append('circle')
                .attr('r', 5)
                .attr('fill', d => {
                    if (this.isInRange(d.val)) {
                        return selCol
                    } else {
                        return unselCol
                    }
                })
                .attr('cx', d => this.xScale(d.val))
                .attr('cy', d => this.yScale(Math.random())),
            update => update
                .attr('fill', d => {
                    if (this.isInRange(d.val)) {
                        return selCol
                    } else {
                        return unselCol
                    }
                })
        );
    }

    /**
     * Draws a bracket (e.g. "[") to denote a closed range
     */
    drawBracket(_this, context, bracketDirection, x0) {
        // note that we pass "this" so we have access to 
        // variables belonging to the component class.

        x0 = _this.xScale(x0);
        let top = _this.yc - _this.delta;
        let bottom = _this.yc + _this.delta;
        if (bracketDirection === 'left') {
            context.moveTo(x0 + _this.binBracketWidth, top)
            context.lineTo(x0, top)
            context.lineTo(x0, bottom)
            context.lineTo(x0 + _this.binBracketWidth, bottom)
        } else {
            context.moveTo(x0 - _this.binBracketWidth, top)
            context.lineTo(x0, top)
            context.lineTo(x0, bottom)
            context.lineTo(x0 - _this.binBracketWidth, bottom)
        }
        return context;
    }

    /**
     * Draws a parenthesis on the plot by drawing a segment
     * of a circle
     */
    drawParen(_this, context, direction, x0) {
        // note that we pass "this" as the first arg so we have
        // access to the member variables from the component class.

        x0 = _this.xScale(x0);
        let top = _this.yc - _this.delta;
        let bottom = _this.yc + _this.delta;
        if (direction === 'left') {
            context.arc(x0 + _this.parenRadius, _this.yc, _this.parenRadius, Math.PI - _this.arcTheta, Math.PI + _this.arcTheta);

        } else {
            context.arc(x0 - _this.parenRadius, _this.yc, _this.parenRadius, -_this.arcTheta, _this.arcTheta);
        }
        return context;
    }

    /**
     * This is a utility function to save some lines of code. It's used
     * to draw either a bracket or parenthesis, which is defined by the 
     * `drawFn`
     */
    drawRangeBoundaries(selection, drawFn, direction) {
        selection.join(
            enter => enter
                .append('path')
                .attr('d', d => {
                    return drawFn(
                        this,
                        d3.path(),
                        direction,
                        d)
                }
                )
                .style('stroke', 'grey')
                .style('stroke-width', 2)
                .style('fill', 'none'),

            update => update
                .attr('d', d => {
                    return drawFn(
                        this,
                        d3.path(),
                        direction,
                        d)
                }
                ),
            exit => exit.remove()
        );
    }


    /**
     * Draws the brackets/parentheses around the user-defined
     * ranges
     */
    drawBinLines() {

        // extract the edges of all the defined bins:
        let leftBrackets = [];
        let rightBrackets = [];
        let leftParens = [];
        let rightParens = [];
        this.showDataRangeWarning = false;
        for (let r of this.rangeSet) {
            if (r.start_inclusive) {
                leftBrackets.push(r.start);
            } else {
                leftParens.push(r.start);
            }
            if (r.end_inclusive) {
                rightBrackets.push(r.end);
            } else {
                rightParens.push(r.end);
            }

            // since we are iterating through the user-ranges anyway,
            // set a flag if any of those ranges extend beyond the range
            // of the data. This will show a gentle warning.
            // Additionally, if they provide ranges that are fully outside the viewing
            // window, then they at least get some feedback.
            if ((r.end > this.maxX) || (r.start < this.minX)) {
                this.showDataRangeWarning = true;
            }
        }

        // Draw the brackets/parens:
        let selection = this.leftBracketsGrp
            .selectAll('path')
            .data(leftBrackets);
        this.drawRangeBoundaries(selection, this.drawBracket, 'left');

        selection = this.rightBracketsGrp
            .selectAll('path')
            .data(rightBrackets);
        this.drawRangeBoundaries(selection, this.drawBracket, 'right');

        selection = this.leftParensGrp
            .selectAll('path')
            .data(leftParens);
        this.drawRangeBoundaries(selection, this.drawParen, 'left');

        selection = this.rightParensGrp
            .selectAll('path')
            .data(rightParens);
        this.drawRangeBoundaries(selection, this.drawParen, 'right');

        // Add numbers at the bottom of the brackets/parens to show where they lie
        let _bins = [...leftBrackets, ...leftParens, ...rightBrackets, ...rightParens];
        let binLabelsSelection = this.binLabelsGrp.selectAll('text')
            .data(_bins);

        binLabelsSelection.join(
            enter => enter
                .append('text')
                .attr('x', d => this.xScale(d))
                .attr('y', this.yc + this.delta + this.offset)
                .text(d => this.d3NumFormat(d)),
            update => update
                .attr('x', d => this.xScale(d))
                .attr('y', this.yc + this.delta + this.offset)
                .text(d => this.d3NumFormat(d)),
            exit => exit.remove()
        );
        this.binLabelsGrp.style('text-anchor', 'middle');
        this.binLabelsGrp.style('font-size', '10px');

        // Count the number of points in each range so the user
        // is aware of how many points they are including in each
        // range selection.
        let binCounts = [];
        for (let i = 0; i < this.rangeSet.length; i++) {
            binCounts.push(0);
        }
        this.data.forEach(d => {
            var found = false;
            var i = 0;
            while (!found && i < this.rangeSet.length) {
                let r = this.rangeSet[i];
                let isContainedIn = r.contains(d.val);
                if (isContainedIn) {
                    binCounts[i] += 1;
                    found = true;
                }
                i += 1;
            }
        });

        // If all the bins are empty, then disable
        // the button which can create the observation sets.
        if (binCounts.every(d => d === 0)) {
            this.createObsSetBtnDisabled = true;
        } else {
            this.createObsSetBtnDisabled = false;
        }

        // Here we prepare data for adding the bin 
        // counts to the plot.
        // We put them at the center of the range.
        // However, if that center falls outside of
        // the data range (and hence, out of view)
        // then we put it at the end of the data range
        let binData = [];
        for (let i = 0; i < binCounts.length; i++) {
            let x0 = this.rangeSet[i].start;
            let x1 = this.rangeSet[i].end;
            let xc = x0 + 0.5 * (x1 - x0);
            if (xc > this.maxX) {
                xc = this.maxX;
            }
            if (xc < this.minX) {
                xc = this.minX;
            }
            binData.push(
                {
                    x: xc,
                    c: binCounts[i]
                }
            );
        }

        // Add those counts to the plot here.
        let binCountsSelection = this.binCountsGrp.selectAll('text')
            .data(binData)

        binCountsSelection.join(
            enter => enter
                .append('text')
                .attr('x', d => this.xScale(d.x))
                .attr('y', this.yc - 1.1 * this.delta)
                .text(d => this.d3NumFormat(d.c)),
            update => update
                .attr('x', d => this.xScale(d.x))
                .attr('y', this.yc - 1.1 * this.delta)
                .text(d => this.d3NumFormat(d.c)),
            exit => exit.remove()
        )
        this.binCountsGrp.style('text-anchor', 'middle');

    }

    /**
     * Called when the button is clicked to create
     * the observation set(s)
     */
    saveObsSets() {

        let selectedSamples = [];
        let obsSets = new Map<string, any[]>();
        this.data.forEach(d => {
            let found = false;
            let i = 0;
            while(!found && i < this.rangeSet.length){
                let r = this.rangeSet[i];
                if(r.contains(d.val)){
                    let rangeStr = `${this.fieldName}_${r.toString()}`;
                    let obj = {id: d.id}
                    if (obsSets.has(rangeStr)){
                        obsSets.get(rangeStr).push(obj);
                    } else {
                        obsSets.set(rangeStr, [obj]);
                    }
                }
              i += 1;
          }
        });

        for(let z of obsSets.entries()){
            const observationSet: CustomSet = {
                name: z[0],
                type: CustomSetType.ObservationSet,
                color: Utils.getRandomColor(),
                elements: z[1],
                multiple: true
            };
            this.metadataService.addCustomSet(observationSet)
        }
    }
}
