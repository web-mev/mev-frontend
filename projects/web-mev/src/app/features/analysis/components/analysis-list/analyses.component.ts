import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter
} from '@angular/core';
import { AnalysesService } from '../../services/analysis.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Operation } from '../../models/operation';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener
} from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';

/**
 * Operation category with nested structure.
 * Each node has a name and an optional list of children.
 */
interface OperationCategoryNode {
  name: string;
  children?: Operation[];
}

/** Flat node with expandable and level information */
interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'mev-analyses',
  templateUrl: './analyses.component.html',
  styleUrls: ['./analyses.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AnalysesComponent implements OnInit {
  workspaceId: string;
  workspace$: Observable<Workspace>;
  operations: Operation[];
  operationCategories: any[];
  selectedOperation: Operation;

  @Output() executedOperationId: EventEmitter<any> = new EventEmitter<any>();

  private _transformer = (node: OperationCategoryNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      level: level,
      ...node
    };
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  constructor(
    private route: ActivatedRoute,
    private apiService: AnalysesService
  ) {}

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.workspace$ = this.apiService.getWorkspaceDetail(this.workspaceId);

    this.apiService.getOperations().subscribe(operations => {
      this.operations = operations;
    });

    this.apiService.getOperationCategories().subscribe(operationCategories => {
      this.selectedOperation = operationCategories[0].children[0]; // show the parameters for the 1st operation by default
      this.dataSource.data = operationCategories;
      this.treeControl.expand(this.treeControl.dataNodes[0]); // expand the 1st operation category by default
    });
  }

  public showOperationDetails(operation) {
    this.selectedOperation = operation;
  }

  public showExecutedOperationResult(data: any) {
    this.executedOperationId.emit(data);
  }
}
