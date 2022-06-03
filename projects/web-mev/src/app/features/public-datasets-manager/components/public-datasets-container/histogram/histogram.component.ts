import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { RouteConfigLoadEnd } from '@angular/router';

@Component({
  selector: 'mev-histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistogramComponent implements OnInit {
  @Input() idValue
  @Input() data
  @Input() currentDataset
  @Input() category

  constructor(private httpClient: HttpClient) { }

  ngOnInit(): void {
    this.getData('target-rnaseq')
  }

  getQueryResults(queryString) {
    return this.httpClient.get(queryString)
  }
  facetField
  histogramDataStorage = {
    'target-rnaseq': {
    }
  }
  countArray = []

  getData(dataset) {
    let query = 'https://api-dev.tm4.org/api/public-datasets/query/target-rnaseq/?q=*&facet=true&facet.field=age_at_diagnosis'
    this.getQueryResults(query)
      .subscribe(res => {
        console.log("Histogram: ", res)
        this.facetField = res['facet_counts']['facet_fields'];
        for (let subcat in this.facetField) {
          let arr = this.facetField[subcat]
          this.histogramDataStorage[dataset][subcat] = []

          for (let i = 0; i < arr.length; i += 2) {
            let obj = {};
            obj[arr[i]] = arr[i + 1];
            this.histogramDataStorage[dataset][subcat].push(obj)
            // this.histogramDataStorage[dataset][subcat]["data"].push(obj);

          }
        }
        // console.log("histo: ",this.histogramDataStorage)

        for (let i = 0; i < this.histogramDataStorage[dataset]['age_at_diagnosis'].length; i++) {
          // console.log(this.histogramDataStorage[dataset]['age_at_diagnosis'][i])
          let object1 = this.histogramDataStorage[dataset]['age_at_diagnosis'][i]
          for (const [key, value] of Object.entries(object1)) {
            // console.log(`${key}: ${value}`);
            for (let j = 0; j < value; j++) {
              let tempObject = {
                "age": parseInt(key)
              }
              this.countArray.push(tempObject)
            }
          }


        }

        console.log("count: ", this.countArray)
        this.createHistogram()
      })
    
  }

  createHistogram() {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 40 },
      width = 340 - margin.left - margin.right,
      height = 200 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(`#${this.idValue}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // X axis: scale and draw:
    var x = d3.scaleLinear()
      .domain([0, d3.max(this.countArray, function (d) { return +d.age })])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
      .range([0, width]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickValues([]));

    // set the parameters for the histogram
    var histogram = d3.histogram()
      .value(function (d) { return d.age; })   // I need to give the vector of value
      .domain(x.domain())  // then the domain of the graphic
      .thresholds(x.ticks(15)); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(this.countArray);

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
      .range([height, 0]);
    y.domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(""));

    // append the bar rectangles to the svg element
    svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", 1)
      .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
      .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
      .attr("height", function (d) { return height - y(d.length); })
      .style("fill", "#69b3a2")
  }
}
