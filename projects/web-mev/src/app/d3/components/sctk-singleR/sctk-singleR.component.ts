import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ElementRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { ClusterLabelerComponent } from '../dialogs/cluster-labeler/cluster-labeler.component';
import { CustomSetType } from '@app/_models/metadata';
import { Utils } from '@app/shared/utils/utils';
import { NotificationService } from '@app/core/core.module';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

@Component({
  selector: 'mev-singleR-cluster',
  templateUrl: './sctk-singleR.component.html',
  styleUrls: ['./sctk-singleR.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class SctkSingleRComponent implements OnInit {

  @Input() outputs;
  @ViewChild('distPlot') svgElement: ElementRef;

  // the UUID of the file holding the cell-to-cluster assignments
  clustersResourceId;

  // the UUID of the file giving the counts of clusters for populating
  // the distribution plot.
  clustersDistId;

  // the count of how many clusters
  clusterCount;

  // the data structure mapping the cluster ID (integer)
  // to the number of cells in that cluster
  distData;

  // used to get the element wrapping the svg plot
  containerId = '#distPlot';

  // name of the file created if the user exports the svg to a file
  imageName = 'cluster_distributions';

  // Some plot params
  margin = { top: 50, right: 300, bottom: 125, left: 70 }; // chart margins
  outerHeight = 500;
  fillFraction = 0.9;
  tooltipOffsetX = 10; // to position the tooltip on the right side of the triggering element

  constructor(
    public dialog: MatDialog,
    private apiService: AnalysesService,
    private metadataService: MetadataService,
    private readonly notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // this.clustersResourceId = this.outputs['SctkSingler.cell_assignments']
    this.clustersDistId = this.outputs['SctkSingler.cell_assignments']

    this.apiService
      .getResourceContent(this.clustersDistId)
      .subscribe(response => {
        this.distData = response
        this.reformatData();
        this.clusterCount = this.distData.length
        this.createChart();
      });
  }

  /**
   * Reformats the basic data structure ( a basic object of
   * cluster Ids pointing to their count ) into a list so D3
   * can handle it.
   */


  reformatData(): void {
    let reformattedData = [];

    for (let data of this.distData) {
      let cellType = data.values.cell_types
      let rowname = data.rowname

      if (!reformattedData[cellType]) {
        reformattedData[cellType] = [];
      }
      reformattedData[cellType].push(rowname)
    }

    let countData = []
    for (let k of Object.keys(reformattedData)) {
      countData.push({
        'clusterId': k,
        'count': reformattedData[k].length
      })
    }
    this.distData = countData
  }

  onResize(event): void {
    this.createChart();
  }

  importClusters(): void {
    const dialogRef = this.dialog.open(ClusterLabelerComponent);

    dialogRef.afterClosed().subscribe(
      data => {
        const prefix = data.prefix;
        // now run through the file contents and assign to the proper cluster
        this.apiService
          .getResourceContent(this.clustersDistId)
          .subscribe(response => {
            if (response.length) {
              // let fileContents = response;
              // initialize a bunch of observation sets
              // that we will populate
              const customSets = {};
              Object.keys(this.distData).forEach(
                index => {
                  let clusterID = this.distData[index]['clusterId']
                  customSets[clusterID] = {
                    name: prefix + '_' + clusterID,
                    type: CustomSetType.ObservationSet,
                    elements: [],
                    color: Utils.getRandomColor(),
                    multiple: true
                  };
                }
              );
              // now fill:
              response.forEach(obj => {
                const sampleId = obj.rowname;
                const assignedCluster = obj.values['cell_types'];
                let temp = {
                  id: sampleId,
                  attributes: {}
                }

                customSets[assignedCluster].elements.push(
                  {
                    id: sampleId,
                    attributes: {}
                  }
                )
              });

              // store using the metadata service
              for (let k of Object.keys(customSets)) {
                this.metadataService.addCustomSet(customSets[k], false);
              }
              this.notificationService.success(
                'Your Single R clusters have been added to your metadata.'
              );
            }
          });
      }
    )
  }

  createChart(): void {

    const outerWidth = this.svgElement.nativeElement.offsetWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;

    // remove anything that might be there if re-plotting
    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

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

    // Tooltip
    const tooltipOffsetX = this.tooltipOffsetX;

    // tool tip for individual points (if displayed)
    const tTip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        return 'Cluster ' + d.clusterId + ': ' + d.count + ' cells';
      });
    svg.call(tTip);

    let clusterIds = [];
    for (let obj of this.distData) {
      clusterIds.push(obj.clusterId)
    }
    let maxCount = d3.max(this.distData, s => +s['count']);

    let xScale = d3.scaleBand()
      .domain(clusterIds)
      .rangeRound([this.margin.left, this.margin.left + width])
      .paddingInner(0.0)
    const xStep = xScale.step()
    let yScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([height, 0])
      .nice()

    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .attr('class', 'x-axis')
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('dx', '-.8em')
      .attr('dy', '.6em')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.append('g')
      .attr("transform",
        "translate(" + (width / 2) + " ," +
        (height + this.margin.top + this.margin.bottom - 60) + ")")
      .append('text')
      .style("text-anchor", "middle")
      .style('fill', 'black') // don't know why, but won't appear unless we set fill
      .text("Cluster ID");

    svg.append('g')
      .attr('transform', 'translate(' + (this.margin.left) + ',0)')
      .call(d3.axisLeft(yScale));

    let boxesGroup = svg.append('g');
    let boxWidth = (this.fillFraction * xStep)
    boxesGroup.selectAll('rect')
      .data(this.distData)
      .enter()
      .append('rect')
      .classed('distbox', true)
      .attr('x', d => xScale(d['clusterId']))
      .attr('y', d => yScale(d['count']))
      .attr('height', d => height - yScale(d['count']))
      .attr('width', boxWidth)
      .style('fill', '#ddebf2')
      .on('mouseover', function (mouseEvent: any, d) {
        tTip.show(mouseEvent, d, this);
        tTip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
      })
      .on('mouseout', tTip.hide);
  }
}
