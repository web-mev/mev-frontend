import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { MatDialog } from '@angular/material/dialog';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { CustomSetType } from '@app/_models/metadata';

/**
 * HCL Component
 *
 * Used for Hierarchical Clustering (HCL) analysis
 */

@Component({
  selector: 'mev-hcl',
  templateUrl: './hcl.component.html',
  styleUrls: ['./hcl.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})

export class HclComponent implements OnChanges {
  @Input() outputs;
  @ViewChild('treePlot') svgElement: ElementRef;
  root;
  hierObsData;
  initializeCount: boolean = false;
  searchValue: string = '';
  clusterType: string = ''
  onClickMode: string = 'expandNode'
  levelRestriction: number = 5;
  customObservationSets = [];
  selectedSamples = [];
  isFeature: string;
  isObservation: string;

  /* Chart settings */
  obsTreeContainerId = '#observationPlot'; // chart container id
  obsImageName: string // file name for downloaded SVG image
  margin = { top: 50, right: 300, bottom: 50, left: 50 }; // chart margins
  outerHeight = 500;
  maxTextLabelLength = 20;
  tooltipOffsetX = 10; // position the tooltip on the right side of the triggering element

  constructor(
    private apiService: AnalysesService,
    private metadataService: MetadataService,
    public dialog: MatDialog,

  ) { }

  ngOnChanges(): void {
    this.clusterType = this.outputs['HierarchicalCluster.clustering_dimension'] === 'features' ? 'featureType' : 'observationType';
    this.obsImageName = this.clusterType === 'observationType' ? 'Hierarchical Clustering - Observations' : 'Hierarchical Clustering - Features';
    this.generateHCL();
  }

  // onResize(event) {
  //   this.createChart(this.root, this.obsTreeContainerId);
  // }

  /**
   * Function to retrieve data for Observation HCL plot
   */

  generateHCL() {
    const obsResourceId = this.outputs[this.clusterType === 'observationType' ? 'HierarchicalCluster.observation_clusters' : 'HierarchicalCluster.feature_clusters'];
    this.isObservation = this.outputs['HierarchicalCluster.observation_clusters'];
    this.isFeature = this.outputs['HierarchicalCluster.feature_clusters'];
    this.customObservationSets = this.clusterType === 'observationType' ? this.metadataService.getCustomObservationSets() : this.metadataService.getCustomFeatureSets();
    this.apiService.getResourceContent(obsResourceId).subscribe(response => {
      this.hierObsData = d3.hierarchy(response);
      this.createChart(this.hierObsData, this.obsTreeContainerId);
    });
  }

  //Updates the chart without fetching the data again
  update(data) {
    this.createChart(data, this.obsTreeContainerId);
  }
  //Cluster Dimension type
  onClusterTypeChange(type) {
    this.clusterType = type;
    this.selectedSamples = [];
    this.levelRestriction = 5;
    this.initializeCount = false;
    this.generateHCL();
  }
  //Pointer mode
  onClickNodeTypeChange(type) {
    this.onClickMode = type;
    this.update(this.hierObsData);
  }

  /**
   * Function to create dendrogram
   */
  private createChart(hierData: any, containerId: string): void {
    if (!hierData) return;

    const outerWidth = this.svgElement.nativeElement.offsetWidth;
    const outerHeight = this.outerHeight;
    const width = outerWidth - this.margin.left - this.margin.right;
    const height = outerHeight - this.margin.top - this.margin.bottom;
    let ifCustomObservationSetExists = false;

    d3.select(containerId)
      .selectAll('svg')
      .remove();

    hierData.descendants().forEach((d, i) => {
      d.id = i;
      d.display = d.depth < this.levelRestriction ? true : false;
      //Keeps track of how many descendants each node has
      if (this.initializeCount === false) {
        d.count = d.count().value.toString();
        if (d.data.children !== undefined) {
          d.data.name = d.count;
        }
      }
      //Stores extra copy of data in d._*** when not being displayed
      if (d._children === undefined) d._children = d.children;
      if (d.data._name === undefined) d.data._name = d.data.name;
      if (d.display === false) d.children = null;
      if (d.count === undefined) d.count = d.data._name;
    });
    this.initializeCount = true;

    hierData.leaves().map(leaf => {
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
    const leafNodeNumber = hierData.leaves().length; // calculate the number of nodes
    // add extra px for every node above 20 to the set height
    const addHeight = leafNodeNumber > 20 ? (leafNodeNumber - 20) * 30 : 0;
    const canvasHeight = height + addHeight;
    const tree = d3.cluster().size([canvasHeight, width - 200]);
    tree(hierData);

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
      .data(hierData.descendants().slice(1))
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', elbow);

    const node = svg
      .selectAll('g.node')
      .data(hierData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => 'translate(' + d['y'] + ',' + d['x'] + ')')
      .on("click",
        this.onClickMode === 'expandNode' ? (event, d) => this.onExpand(hierData, d) : (event, d) => this.highlightNodes(d, containerId)
      );

    node
      .append('circle')
      .attr('r', 4);

    const leafNode = node.filter(d => d.data.isLeaf === true)

    // Tooltip
    const tooltipOffsetX = this.tooltipOffsetX;
    const tip = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html((event, d) => d.data.name);
    svg.call(tip);

    const truncate = input =>
      input.length > this.maxTextLabelLength
        ? `${input.substring(0, this.maxTextLabelLength)}...`
        : input;
    leafNode
      .append('text')
      .attr('dx', 10)
      .attr('dy', 3)
      .attr('class', 'textLabel')
      .text(d => truncate(d.data.name))
      .on('mouseover', function (mouseEvent: any, d) {
        tip.show(mouseEvent, d, this);
        tip.style('left', mouseEvent.x + tooltipOffsetX + 'px');
      })
      .on('mouseout', tip.hide);

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
          .attr('x', (el, i) => 125 + 30 * i)
          .attr('y', -7)
          .attr('height', '10')
          .attr('width', '10')
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
        .attr('transform', function (d, i) {
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
        .attr('y', 10)
        .style('fill', '#000')
        .attr('class', 'legend-label')
        .text(d => d.name);
    }

    function elbow(d) {
      return 'M' + d.parent.y + ',' + d.parent.x + 'V' + d.x + 'H' + d.y;
    }
  }

  /**
   * Function that is triggered when the user clicks the "Create a custom sample" button
   */
  onCreateCustomSampleSet() {
    let samples = this.selectedSamples.map(elem => ({ id: elem }));
    const dialogRef = this.dialog.open(AddSampleSetComponent, {
      data: { type: this.clusterType === 'observationType' ? CustomSetType.ObservationSet : CustomSetType.FeatureSet }
    });

    dialogRef.afterClosed().subscribe(customSetData => {
      if (customSetData) {
        const customSet = {
          name: customSetData.name,
          type: this.clusterType === 'observationType' ? CustomSetType.ObservationSet : CustomSetType.FeatureSet,
          color: customSetData.color,
          elements: samples,
          multiple: true
        };

        // if the custom set has been successfully added, update the plot
        if (this.metadataService.addCustomSet(customSet)) {
          this.levelRestriction = 5;
          this.initializeCount = false;
          this.generateHCL();
          this.selectedSamples = [];
        }
      }
    })
  }

  onSearch(gene: string = this.searchValue) {
    this.levelRestriction = Number.POSITIVE_INFINITY
    const obsResourceId = this.outputs[this.clusterType === 'observationType' ? 'HierarchicalCluster.observation_clusters' : 'HierarchicalCluster.feature_clusters'];

    this.apiService.getResourceContent(obsResourceId).subscribe(response => {
      let rootCopy = d3.hierarchy(response);
      rootCopy.descendants().forEach((d, i) => {
        d.id = i;
      })
      let searchPathIds = {}

      //Creates a list of node ids to get to the search item
      rootCopy.descendants().forEach((d, i) => {
        if (d.data.name === gene) {
          while (d !== null) {
            searchPathIds[d.id] = 1;
            d = d.parent;
          }
        }
      })

      rootCopy.descendants().forEach((d, i) => {
        if (d._children === undefined) d._children = d.children;
        if (d.data._name === undefined) d.data._name = d.data.name;

        d.count = d.count().value;
        d.data.name = d.count;
        if (d.count == 1) d.data.name = d.data._name;
        if (searchPathIds[d.id] === 1) {
          let isRealLeaf = parseInt(d.data._name)
          if (isNaN(isRealLeaf)) {
            d.children = d._children;
            d.display = true;
            d.data.name = d.data._name;
          } else if (d.children === null) {
            d.children = d._children;
            d.display = true;
            d.data.name = " ";
          }
        } else {
          d.display = false;
          d.children = null;
        }
      })
      this.initializeCount = true;
      this.update(rootCopy);
    });
  }

  onExpand(data, d) {
    let currId = d.id;
    data.descendants().forEach(node => {
      this.levelRestriction = Number.POSITIVE_INFINITY;
      if (node.id === currId) {
        //Comparison to leafs have string names
        let isRealLeaf = parseInt(node.data._name)
        if (isNaN(isRealLeaf)) {
          node.children = node._children;
          node.display = true;
        } else if (node.children === null) {
          node.children = node._children;
          node.display = true;
          node.data.name = " ";
        } else if (node.children.length > 0) {
          node.children = null;
          node.data.name = node.data._name;
          node.display = false;
        }
      }
    })
    this.update(data);
  }

  highlightNodes(d, containerId) {
    let itemToRemoveArr = [];
    const currSampleSetHash = {}
    //Iterates through tree and marks each as highlighted or not. 
    d.descendants().forEach(
      node => {
        if (node._children && node._children.length > 0) {
          let traverseTree = (gene) => {
            if (gene._children) {
              if (!currSampleSetHash[gene.id]) {
                currSampleSetHash[gene.id] = 1;
                gene.data.isHighlighted = gene.data.isHighlighted ? false : true;
              }
            }
            if (gene._children === undefined || gene._children === null) {
              if (!currSampleSetHash[gene.data.name]) {
                currSampleSetHash[gene.data.name] = 1;
                gene.isHighlighted = gene.isHighlighted ? false : true;
                if (gene._children === undefined) {
                  gene.isHighlighted ?
                    (this.selectedSamples.includes(gene.data.name) ? null : this.selectedSamples.push(gene.data.name))
                    : itemToRemoveArr.push(gene.data.name)
                }
              }
              return;
            }
            for (let i = 0; i < gene._children.length; i++) {
              traverseTree(gene._children[i])
            }
          }
          let currentTree = traverseTree(node);
          this.selectedSamples = this.selectedSamples.filter(e => !itemToRemoveArr.includes(e));
          return currentTree
        } else {
          node.data.isHighlighted = node.data.isHighlighted ? false : true;
          node.data.isHighlighted ?
            (this.selectedSamples.includes(node.data.name) ? null : this.selectedSamples.push(node.data.name))
            : this.selectedSamples = this.selectedSamples.filter(e => e !== node.data.name);
        }
      })

    d3.select(containerId)
      .selectAll('circle')
      .attr('class', (d: any) => {
        if (d.data.isHighlighted) return 'highlighted';
      });
  }
}
