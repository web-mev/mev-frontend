import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  OnInit,
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

  customObservationSets = [];
  selectedSamples = [];
  selectedFeatures = [];
  selectedSamplesStatusTxt: string;
  selectedFeaturesStatusTxt: string;

  /* Chart settings */
  featTreeContainerId = '#featurePlot';
  obsTreeContainerId = '#observationPlot';
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
    this.generateHCLPlot();
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
   * Function to retrieve data for PCA plot
   */
  generateHCLPlot() {
    const featResourceId = this.outputs.features_hcl;
    const obsResourceId = this.outputs.observations_hcl;

    this.customObservationSets = this.metadataService.getCustomObservationSets();
    this.apiService.getResourceContent(featResourceId).subscribe(response => {
      this.hierFeatData = response;
      this.createChart(
        this.hierFeatData,
        this.featTreeContainerId,
        CustomSetType.FeatureSet
      );
    });

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
   * Function to create scatter plot
   */
  private createChart(hierData, containerId, type): void {
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
      leaf.data.colors = [];
      this.customObservationSets.forEach(set => {
        if (set.elements.some(e => e.id === sample)) {
          ifCustomObservationSetExists = true;
          leaf.data.colors.push(set.color);
        }
      });
    });

    const leafNodeNumber = root.leaves().length; // calculate the number of nodes
    //add extra 50px for every node above 20 to the set height
    const addHeight = leafNodeNumber > 20 ? (leafNodeNumber - 20) * 50 : 0;
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

    const link = svg
      .selectAll('path.link')
      .data(root.descendants().slice(1))
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', '#ccc')
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
      .attr('r', 4)
      .attr('stroke', '#a1887f');

    function highlightNodes(event, d: any) {
      if (type === CustomSetType.ObservationSet) {
        that.selectedSamples = d.leaves().map(leaf => leaf.data.name);
        that.selectedSamplesStatusTxt = '';
      } else {
        that.selectedFeatures = d.leaves().map(leaf => leaf.data.name);
        that.selectedFeaturesStatusTxt = '';
      }

      root.descendants().forEach(node => (node.data.isHighlighted = false));
      d.descendants().forEach(node => (node.data.isHighlighted = true));

      d3.select(containerId)
        .selectAll('circle')
        .attr('class', (d: any) => {
          if (d.data.isHighlighted) return 'highlighted';
        });
    }

    node
      .append('rect')
      .filter(function(d) {
        return d.data.name.length > 2;
      })
      // .attr('x', function (d, i) { return d.children ? (-1 * 1) - 12 : 900; })
      .attr('class', 'rectLabel')
      .attr('id', function(d, i) {
        return 'rect' + i;
      })
      .attr('y', -4)
      .attr('height', '10')
      .attr('width', '50');

    node
      .append('text')
      .filter(function(d) {
        return d.data.name.length > 2;
      })
      .attr('dx', function(d) {
        return d.children ? -8 : 8;
      })
      .attr('class', 'textLabel')
      .attr('id', function(d, i) {
        return 'txt' + i;
      })
      .attr('dy', 3)
      .attr('text-anchor', function(d) {
        return d.children ? 'end' : 'start';
      })
      .text(function(d) {
        return d.data.name;
      });

    // Color squares for leaf nodes to indicate custom sample sets
    node
      .append('g')
      .filter(function(d) {
        return d.data.name.length > 2;
      })
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

    function elbow(d, i) {
      return 'M' + d.parent.y + ',' + d.parent.x + 'V' + d.x + 'H' + (d.y - 0);
    }
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
        let customSet = {
          name: customSetData.name,
          type: type,
          color: customSetData.color,
          elements: samples,
          multiple: true
        };

        this.metadataService.addCustomSet(customSet);

        this.generateHCLPlot();
        if (type === CustomSetType.ObservationSet) {
          this.selectedSamples = [];
          this.selectedSamplesStatusTxt =
            'The new custom set has been successfully created.';
        } else {
          this.selectedFeatures = [];
          this.selectedFeaturesStatusTxt =
            'The new custom set has been successfully created.';
        }
      }
    });
  }
}
