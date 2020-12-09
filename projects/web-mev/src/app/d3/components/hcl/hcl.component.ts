import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  ElementRef,
  ViewChild
} from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import * as d3 from 'd3';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { MatDialog } from '@angular/material/dialog';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { CustomSetType } from '@app/_models/metadata';

@Component({
  selector: 'mev-hcl',
  templateUrl: './hcl.component.html',
  styleUrls: ['./hcl.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class HclComponent implements OnChanges {
  @Input() outputs;
  @ViewChild('treePlot') svgElement: ElementRef;
  hierFeatData;
  hierObsData;
  obSetType = CustomSetType.ObservationSet;
  featSetType = CustomSetType.FeatureSet;

  customObservationSets = [];
  selectedSamples = [];
  selectedFeatures = [];

  /* Chart settings */

  featTreeContainerId = '#featurePlot';
  obsTreeContainerId = '#observationPlot';
  isFeatTreePanelExpanded = false;
  featImageName = 'Hierarchical clustering - Features'; // file name for downloaded SVG image
  obsImageName = 'Hierarchical clustering - Observations';
  margin = { top: 50, right: 300, bottom: 50, left: 50 }; // chart margins
  outerHeight = 500;

  constructor(
    private apiService: AnalysesService,
    private metadataService: MetadataService,
    public dialog: MatDialog
  ) {}

  ngOnChanges(): void {
    this.generateHCL();
  }

  onResize(event) {
    this.createChart(
      this.hierFeatData,
      this.featTreeContainerId,
      CustomSetType.FeatureSet
    );
    this.createChart(
      this.hierObsData,
      this.obsTreeContainerId,
      CustomSetType.ObservationSet
    );
  }

  /**
   * Function to retrieve data for HCL plots
   */
  generateHCL() {
    this.generateObsHCL();
    this.generateFeatHCL();
  }

  /**
   * Function to retrieve data for Observation HCL plot
   */
  generateObsHCL() {
    const obsResourceId = this.outputs.observations_hcl;
    this.customObservationSets = this.metadataService.getCustomObservationSets();
    this.apiService.getResourceContent(obsResourceId).subscribe(response => {
      this.hierObsData = response;
      this.createChart(
        this.hierObsData,
        this.obsTreeContainerId,
        CustomSetType.ObservationSet
      );
    });
  }

  /**
   * Function to retrieve data for Feature HCL plot
   */
  generateFeatHCL() {
    if (this.isFeatTreePanelExpanded && !this.hierFeatData) {
      const featResourceId = this.outputs.features_hcl;
      this.apiService.getResourceContent(featResourceId).subscribe(response => {
        this.hierFeatData = response;
        this.createChart(
          this.hierFeatData,
          this.featTreeContainerId,
          CustomSetType.FeatureSet
        );
      });
    }
  }

  /**
   * Function to create dendrogram
   */
  private createChart(
    hierData: any,
    containerId: string,
    type: CustomSetType
  ): void {
    if (!hierData) return;

    const outerWidth = this.svgElement.nativeElement.offsetWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;

    d3.select(containerId)
      .selectAll('svg')
      .remove();

    const root = d3.hierarchy(hierData);
    let ifCustomObservationSetExists = false;
    root.leaves().map(leaf => {
      const sample = leaf.data.name;
      leaf.data.isLeaf = true;
      leaf.data.colors = [];
      this.customObservationSets.forEach(set => {
        if (set.elements.some(e => e.id === sample)) {
          ifCustomObservationSetExists = true;
          leaf.data.colors.push(set.color);
        }
      });
    });
    const leafNodeNumber = root.leaves().length; // calculate the number of nodes
    // add extra 50px for every node above 20 to the set height
    const addHeight = leafNodeNumber > 20 ? (leafNodeNumber - 20) * 30 : 0;
    const canvasHeight = height + addHeight;
    const tree = d3.cluster().size([canvasHeight, width - 200]);
    tree(root);
    const svg = d3
      .select(containerId)
      .append('svg')
      .attr('width', outerWidth)
      .attr('height', outerHeight + addHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      )
      .style('fill', 'none');

    svg
      .selectAll('path.link')
      .data(root.descendants().slice(1))
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', elbow);

    const that = this;
    const node = svg
      .selectAll('g.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => 'translate(' + d['y'] + ',' + d['x'] + ')')
      .on('click', highlightNodes);

    node
      .append('circle')
      .filter(d => d.data.name.length > 0)
      .attr('r', 4);

    const leafNode = node.filter(d => d.data.isLeaf === true);

    function highlightNodes(event, d: any) {
      d.descendants().forEach(
        node =>
          (node.data.isHighlighted = node.data.isHighlighted ? false : true)
      );

      const selectedItems = root
        .leaves()
        .filter(leaf => leaf.data.isHighlighted)
        .map(leaf => leaf.data.name);

      if (type === CustomSetType.ObservationSet) {
        that.selectedSamples = selectedItems;
      } else {
        that.selectedFeatures = selectedItems;
      }
      d3.select(containerId)
        .selectAll('circle')
        .attr('class', (d: any) => {
          if (d.data.isHighlighted) return 'highlighted';
        });
    }

    leafNode
      .append('text')
      .attr('dx', 10)
      .attr('dy', 3)
      .attr('class', 'textLabel')
      .text(d => d.data.name);

    // Color squares for leaf nodes to indicate custom sample sets
    leafNode
      .append('g')
      .attr('width', 200)
      .each((d, ix, nodes) => {
        d3.select(nodes[ix])
          .selectAll('sampleSetColors')
          .data(d['data'].colors)
          .enter()
          .append('rect')
          .attr('x', (el, i) => 100 + 30 * i)
          .attr('y', -10)
          .attr('height', '20')
          .attr('width', '20')
          .attr('fill', (d: string) => d || 'transparent');
      });

    // Legend (only if custom observations exist)
    if (ifCustomObservationSetExists) {
      const legend = svg
        .selectAll('.legend')
        .data(this.customObservationSets)
        .enter()
        .append('g')
        .classed('legend', true)
        .attr('transform', function(d, i) {
          return 'translate(0,' + i * 20 + ')';
        });

      legend
        .append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('x', width + 50)
        .attr('fill', d => d.color);

      legend
        .append('text')
        .attr('x', width + 70)
        // .attr('dy', '.5em')
        .attr('y', 8)
        .style('fill', '#000')
        .attr('class', 'legend-label')
        .text(d => d.name);
    }

    function elbow(d) {
      return 'M' + d.parent.y + ',' + d.parent.x + 'V' + d.x + 'H' + d.y;
    }
  }

  /**
   * Function that is triggered when the Feature Tree Panel is expanded
   */
  onOpenGeneHCLPanel() {
    this.isFeatTreePanelExpanded = true;
    this.generateFeatHCL();
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomSampleSet(type) {
    let samples;
    if (type === CustomSetType.ObservationSet) {
      samples = this.selectedSamples.map(elem => ({ id: elem }));
    } else {
      samples = this.selectedFeatures.map(elem => ({ id: elem }));
    }

    const dialogRef = this.dialog.open(AddSampleSetComponent, {
      data: { type: type }
    });

    dialogRef.afterClosed().subscribe(customSetData => {
      if (customSetData) {
        const customSet = {
          name: customSetData.name,
          type: type,
          color: customSetData.color,
          elements: samples,
          multiple: true
        };

        // if the custom set has been successfully added, update the plot
        if (this.metadataService.addCustomSet(customSet)) {
          this.generateHCL();
          if (type === CustomSetType.ObservationSet) {
            this.selectedSamples = [];
          } else {
            this.selectedFeatures = [];
          }
        }
      }
    });
  }
}
