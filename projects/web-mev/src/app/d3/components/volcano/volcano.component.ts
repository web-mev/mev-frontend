import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import { Options } from '@angular-slider/ngx-slider';

/*
* Component for presenting the form which creates a boxplot.
* The actual code to create the boxplot is in box-plotting.component.ts/html
*/
@Component({
  selector: 'mev-volcano',
  templateUrl: './volcano.component.html',
  styleUrls: ['./volcano.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
// export class VolcanoComponent extends MevBaseExpressionPlotFormComponent {
export class VolcanoComponent implements OnInit {
  @Input() data
  containerId = '#volcanoPlot';
  imageName = 'volcanoPlot';
  isLoaded = true
  showFCBounds = true;
  showPValueBounds = true;
  private readonly API_URL = environment.apiUrl;

  constructor(
    private apiService: AnalysesService,
    private httpClient: HttpClient,
  ) { }

  resData = [];
  windowWidth = 1600;
  windowHeight = 900;
  pMin = 1000;
  pMax = 0;
  foldMin = 1000;
  foldMax = 0;

  fcValue = 0.5;
  fcOptions: Options = {
    floor: 0.5,
    ceil: 2,
    showTicks: true,
    showSelectionBar: true,
    step: .5,
    ticksArray: [0.5, 1, 1.5, 2]
  };

  pValue = 0.01;
  pValOptions: Options = {
    floor: 0.001,
    ceil: 0.05,
    showTicks: true,
    showSelectionBar: true,
    stepsArray: [
      { value: 0.001 },
      { value: 0.005 },
      { value: 0.01 },
      { value: 0.05 },
    ],
    ticksArray: [0.001, 0.005, 0.01, 0.05]
  };
  pvalueMin = 1000;

  ngOnInit() {
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight

    this.isLoaded = false;
    let deseqId = this.data['dge_results'];

    let queryURL = `${this.API_URL}/resources/${deseqId}/contents/transform/?transform-name=volcano-subset&pval=${this.pValue}&lfc=${this.fcValue}&fraction=0.001`
    this.httpClient.get(queryURL).pipe(
      catchError(error => {
        let message = `Error: ${error.error.error}`;
        throw message
      }))
      .subscribe(res => {
        this.isLoaded = true;
        for (let index in res) {
          let gene = res[index]
          let name = gene['rowname'];
          let pvalue = gene['values']['pvalue']
          let foldChange = gene['values']['log2FoldChange'];

          if (pvalue !== null && foldChange !== null && pvalue !== 0) {
            this.pMin = Math.min(this.pMin, -Math.log10(pvalue));
            this.pMax = Math.max(this.pMax, -Math.log10(pvalue));
            this.pvalueMin = Math.min(this.pvalueMin, pvalue)

            this.foldMin = Math.min(this.foldMin, foldChange);
            this.foldMax = Math.max(this.foldMax, foldChange);

            let tempObj = {
              name,
              pvalue,
              foldChange
            }

            this.resData.push(tempObj);
          }
        }
        for (let index in res) {
          let gene = res[index]
          let name = gene['rowname'];
          let pvalue = gene['values']['pvalue']
          let foldChange = gene['values']['log2FoldChange'];

          if (pvalue === 0) {
            let tempObj = {
              name,
              pvalue: this.pvalueMin / 10**10,
              foldChange
            }

            this.resData.push(tempObj);
          }
        }
        this.pMax = this.pMax * 1.1;
        this.createChart();
      })
  }

  regeneratePlot() {
    this.isLoaded = false;
    this.createChart();
  }

  createChart() {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 60, left: 60 },
      width = this.windowWidth * .66 - margin.left - margin.right,
      height = this.windowHeight * .7 - margin.top - margin.bottom;

    d3.select("#volcanoPlot")
      .selectAll('svg')
      .remove();

    // append the svg object to the body of the page
    var svg = d3.select("#volcanoPlot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    let xMin = -Math.max(Math.abs(this.foldMin), Math.abs(this.foldMax));
    let xMax = Math.max(Math.abs(this.foldMin), Math.abs(this.foldMax));

    // Add X axis
    var x = d3.scaleLinear()
      .domain([xMin, xMax])
      .range([0, width]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([this.pMin, this.pMax])
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add X axis label:
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width / 2 + margin.left)
      .attr("y", height + margin.top + 30)
      .text("Log2 Fold Change");

    // Y axis label:
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -margin.top - height / 2 + 20)
      .text("-Log10 (P Value)")

    // Add dots
    svg.append('g')
      .selectAll("dot")
      .data(this.resData)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return x(d.foldChange); })
      .attr("cy", function (d) { return y(-Math.log10(d.pvalue)); })
      .attr("r", 2)
      .style("fill", d => {
        if (d.foldChange < -this.fcValue && -Math.log10(d.pvalue) > -Math.log10(this.pValue)) {
          return "rgba(65,105,225, .8)"
        } else if (d.foldChange > this.fcValue && -Math.log10(d.pvalue) > -Math.log10(this.pValue)) {
          return "rgb(255,99,71, .8)"
        } else {
          return "rgba(140,140,140, .8)"
        }
      })

    if (this.showFCBounds) {
      svg.append("line")
        .style("stroke", "tomato")
        .attr("x1", x(this.fcValue))
        .attr("y1", 0)
        .attr("x2", x(this.fcValue))
        .attr("y2", height);

      svg.append("line")
        .style("stroke", "royalblue")
        .attr("x1", x(-this.fcValue))
        .attr("y1", 0)
        .attr("x2", x(-this.fcValue))
        .attr("y2", height);
    }

    if (this.showPValueBounds) {
      svg.append("line")
        .style("stroke", "rgba(110,110,110, .6)")
        .attr("x1", 0)
        .attr("y1", y(-Math.log10(this.pValue)))
        .attr("x2", width)
        .attr("y2", y(-Math.log10(this.pValue)));
    }

    setTimeout(() => {
      this.isLoaded = true;
    }, 1000)
  }
}
