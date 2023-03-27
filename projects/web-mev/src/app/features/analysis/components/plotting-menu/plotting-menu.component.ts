import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ActivatedRoute } from '@angular/router';

import {
  MatTreeFlattener,
  MatTreeFlatDataSource
} from '@angular/material/tree';


interface SimpleNode {
  name: string;
  id: string;
  children?: SimpleNode[];
}

const TREE_DATA: SimpleNode[] = [
  {
    id: 'boxplot',
    name: 'Expression Boxplot'
  },
  {
    id: 'heatmap',
    name: 'Expression Heatmap'
  },
  {
    id: 'panda',
    name: 'Network Subsetting'
  }
];


/**
 * Flat node with expandable and level information
 */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'mev-plotting-menu',
  templateUrl: './plotting-menu.component.html',
  styleUrls: ['./plotting-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PlottingMenuComponent implements OnInit {

  currentPlotType = '';
  isNavPanelCollapsed = false;
  activeNode: SimpleNode;

  hasChild = (_: number, node: FlatNode) => node.expandable;

  private _transformer = (node: SimpleNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      level: level,
      ...node
    };
  }

  treeControl = new FlatTreeControl<FlatNode>(
      node => node.level, node => node.expandable);

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  workspaceId;
  outputs;

  constructor(private route: ActivatedRoute) { 
    this.dataSource.data = TREE_DATA;
   }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
  }

  onSelectNode(node:SimpleNode) {
    this.currentPlotType = node.id;
    this.activeNode = node;
  }

  isNodeActive(name: string): boolean {
    return name === this.currentPlotType
  }

  /**
   * Control if the left side panel is collapsed or expanded
   */
  togglePanel(): void {
    this.isNavPanelCollapsed = !this.isNavPanelCollapsed;
  }

}
