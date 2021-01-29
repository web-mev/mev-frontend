import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  EventEmitter,
  Output
} from '@angular/core';
import * as d3 from 'd3';
import * as d3dag from 'd3-dag';
import d3Tip from 'd3-tip';
import { AnalysesService } from '../../services/analysis.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PreviewDialogComponent } from '@app/features/workspace-detail/components/dialogs/preview-dialog/preview-dialog.component';
import { WorkspaceDetailService } from '@app/features/workspace-detail/services/workspace-detail.service';

@Component({
  selector: 'mev-analysis-flow',
  templateUrl: './analysis-flow.component.html',
  styleUrls: ['./analysis-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AnalysisFlowComponent implements OnInit {
  @Output() executedOperationId: EventEmitter<any> = new EventEmitter<any>();

  noDataIsAvailable = false;

  /* DAG Chart settings */
  containerId = '#dagPlot';
  tooltipOffsetX = 10; // position the tooltip on the right side of the triggering element
  margin = { top: 50, right: 50, bottom: 50, left: 50 }; // chart margins
  nodeSize = 30; // tree node size
  maxTextLabelLength = 13;
  nodeTypes = [
    {
      id: 'data_resource_node',
      label: 'File',
      img: '../../../../assets/file.png'
    },
    { id: 'op_node', label: 'Operation', img: '../../../../assets/gear.png' }
  ];

  constructor(
    private route: ActivatedRoute,
    private analysesService: AnalysesService,
    private workspaceDetailService: WorkspaceDetailService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.analysesService.getExecOperationDAG(workspaceId).subscribe(data => {
      this.buildDAG(data);
    });
  }

  /**
   * Function to render DAG (Directed Acyclic Graph)
   */
  buildDAG(data): void {
    if (!data || data.length === 0) {
      this.noDataIsAvailable = true;
      return;
    }

    const dag = d3dag.dagStratify()(data);
    const layout = d3dag.sugiyama()(dag);
    const scale = x => 100 * x;

    // use computed layout and get size
    const width = scale(layout.width);
    const height = scale(layout.height);

    d3.select(this.containerId)
      .selectAll('svg')
      .remove();

    const svgSelection = d3
      .select(this.containerId)
      .append('svg')
      .attr('width', width + this.margin.right + this.margin.left)
      .attr('height', height + this.margin.top + this.margin.bottom);

    const defs = svgSelection.append('defs');

    this.nodeTypes.forEach(d => {
      defs
        .append('svg:pattern')
        .attr('id', d.id)
        .attr('width', this.nodeSize)
        .attr('height', this.nodeSize)
        .append('svg:image')
        .attr('href', d.img)
        .attr('width', this.nodeSize)
        .attr('height', this.nodeSize)
        .attr('x', this.nodeSize / 2)
        .attr('y', this.nodeSize / 2);
    });

    // Draw edges
    const line = d3
      .line()
      .curve(d3.curveCatmullRom)
      .x(d => d['x'])
      .y(d => d['y']);

    // Plot edges
    svgSelection
      .append('g')
      .selectAll('path')
      .data(dag.links())
      .enter()
      .append('path')
      .attr('d', ({ points }: any) => {
        points = points.map(el => ({ x: scale(el.x), y: scale(el.y) }));
        return line(points);
      })
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', '#ccc');

    // Select nodes
    const nodes = svgSelection
      .append('g')
      .selectAll('g')
      .data(dag.descendants())
      .enter()
      .append('g')
      .attr(
        'transform',
        ({ x, y }: any) => `translate(${scale(x)}, ${scale(y)})`
      );

    // Tooltip
    const tooltipOffsetX = this.tooltipOffsetX;
    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => {
        const name = d.data.node_name;
        const typeLabel = this.nodeTypes.find(
          type => type.id === d.data.node_type
        ).label;
        return typeLabel + ': ' + name;
      });
    svgSelection.call(tip);

    // Plot node circles
    nodes
      .append('circle')
      .attr('r', this.nodeSize)
      .attr('fill', d => {
        return 'url(#' + d.data['node_type'] + ')';
      })
      .attr('class', 'circle')
      .on('mouseover', function(mouseEvent: any, d) {
        tip.show(mouseEvent, d, this);
        tip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
      })
      .on('mouseout', tip.hide)
      .on('click', (event, d) => {
        tip.hide();
        this.onNodeClick(d);
      });

    // Add text to root nodes
    const truncate = input =>
      input.length > this.maxTextLabelLength
        ? `${input.substring(0, this.maxTextLabelLength)}...`
        : input;

    nodes
      .append('text')
      .filter(d => d.data['parentIds'].length === 0)
      .text(d => truncate(d.data['node_name']))

      .attr('dx', '-3em')
      .attr('dy', '-2em')
      .attr('class', 'text-label');
  }

  /**
   * Function is triggered when a tree node is clicked. Clicking on operation nodes
   * redirects to the Analysis Result. Clicking on Resource nodes opens the Preview file pop-up.
   */
  onNodeClick(d) {
    if (d.data.node_type === 'op_node') {
      this.executedOperationId.emit(d.data.id);
    } else {
      this.previewItem(d.data.id);
    }
  }

  /**
   * Function is used to preview the content of the workspace resource (file)
   */
  previewItem(resourceId) {
    this.workspaceDetailService
      .getResourcePreview(resourceId)
      .subscribe(data => {
        const previewData = {};
        if (data?.results?.length && 'rowname' in data.results[0]) {
          const minN = Math.min(data.results.length, 10);
          const slicedData = data.results.slice(0, minN);
          const columns = Object.keys(slicedData[0].values);
          const rows = slicedData.map(elem => elem.rowname);
          const values = slicedData.map(elem => {
            const rowValues = [];
            const elemValues = elem.values;
            columns.forEach(col => rowValues.push(elemValues[col]));
            return rowValues;
          });
          previewData['columns'] = columns;
          previewData['rows'] = rows;
          previewData['values'] = values;
        }

        const dialogRef = this.dialog.open(PreviewDialogComponent, {
          data: {
            previewData: previewData
          }
        });
      });
  }

  /**
   * Function performs a ‘workspace export’ which takes the graph
   * and make some ‘full record’ including the operation versions, etc.
   */
  saveAnalysisHistory() {}
}
