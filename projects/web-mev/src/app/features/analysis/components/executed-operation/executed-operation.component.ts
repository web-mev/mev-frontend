import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnalysesService } from '../../services/analysis.service';
import { switchMap, tap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Operation } from '../../models/operation';
import {
  MatTreeFlattener,
  MatTreeFlatDataSource
} from '@angular/material/tree';

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
  selector: 'mev-executed-operation',
  templateUrl: './executed-operation.component.html',
  styleUrls: ['./executed-operation.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ExecutedOperationComponent implements OnInit {
  private executedOperationResultSubscription: Subscription = new Subscription();
  execOperations;
  execOperationResult;
  selectedExecOperationId: string;
  selectedExecOperationName: string;
  data;

  @Input() execOperationId: string;
  outputs;
  isInProgress: boolean;

  categories = new Set();
  subcategories = [];

  activeNode: Operation;
  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable
  );

  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  private _transformer = (node: OperationCategoryNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      level: level,
      ...node
    };
  };

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  constructor(
    private route: ActivatedRoute,
    private apiService: AnalysesService
  ) {}

  ngOnInit(): void {
    const operationTree = {};
    const workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.isInProgress = true;
    this.executedOperationResultSubscription = this.apiService
      .getExecOperations(workspaceId)
      .pipe(
        tap(operations => {
          this.execOperations = operations;
          operations.forEach(execOperation => {
            execOperation = { ...execOperation, name: execOperation.job_name };
            const categories = execOperation.operation.categories;
            const operation = execOperation.operation.operation_name;
            categories.forEach(category => {
              if (category in operationTree) {
                const level = operationTree[category];
                if (operation in level) {
                  level[operation].push(execOperation);
                } else {
                  level[operation] = [execOperation];
                }
              } else {
                const level = {};
                level[operation] = [execOperation];
                operationTree[category] = level;
              }
            });
            const operationTreeArr = [];
            for (const elem in operationTree) {
              const categoryLevel = { name: elem, children: [] };
              for (const subElem in operationTree[elem]) {
                categoryLevel.children.push({
                  name: subElem,
                  children: operationTree[elem][subElem]
                });
              }
              operationTreeArr.push(categoryLevel);
            }
            this.dataSource.data = operationTreeArr.sort();
            this.treeControl.expand(this.treeControl.dataNodes[0]);
          });
        }),
        switchMap(() => {
          if (this.execOperationId) {
            this.selectedExecOperationId = this.execOperationId;
            const execOperation = this.getExecOperationByOperationId(
              this.execOperationId
            );

            this.activeNode = execOperation;
            this.selectedExecOperationName = execOperation.job_name;

            // if the opertion has been already completed, just extract its data from the list
            if (execOperation?.outputs || execOperation?.error_messages) {
              this.outputs = {
                operation: execOperation.operation,
                job_name: execOperation.job_name,
                ...execOperation.outputs,
                ...execOperation.inputs,
                error_messages: execOperation.error_messages
              };
              return of({ body: execOperation });
            }

            return this.apiService.getExecutedOperationResult(
              this.execOperationId
            );
          }
          return of();
        })
      )
      .subscribe((response: any) => {
        this.outputs = {
          operation: response?.body?.operation,
          job_name: response?.body?.job_name,
          ...response?.body?.outputs,
          ...response?.body?.inputs,
          error_messages: response?.body?.error_messages
        };
        if (response?.body?.error_messages || response?.body?.outputs) {
          this.isInProgress = false;
        }
      });
  }

  getOutputs(operationId) {
    const idx = this.execOperations.findIndex(val => val.id === operationId);
    return this.execOperations[idx].outputs;
  }

  onSelectExecOperation(execOperation) {
    this.activeNode = execOperation;
    this.isInProgress = true;
    this.executedOperationResultSubscription.unsubscribe();
    this.execOperationId = execOperation.id;
    this.selectedExecOperationName = execOperation.job_name;

    // if the operation has been already completed, just extract its data from the list
    if (execOperation.outputs || execOperation.error_messages) {
      this.outputs = {
        operation: execOperation.operation,
        job_name: execOperation.job_name,
        ...execOperation.outputs,
        ...execOperation.inputs,
        error_messages: execOperation.error_messages
      };
      this.isInProgress = false;
    } else {
      this.executedOperationResultSubscription = this.apiService
        .getExecutedOperationResult(this.execOperationId)
        .subscribe(response => {
          this.outputs = {
            operation: response?.body?.operation,
            job_name: response?.body?.job_name,
            ...response?.body?.outputs,
            ...response?.body?.inputs,
            error_messages: response?.body?.error_messages
          };
          if (response?.body?.error_messages || response?.body?.outputs) {
            this.isInProgress = false;
          }
        });
    }
  }

  getExecOperationByOperationId(operationId: string) {
    const idx = this.execOperations.findIndex(val => val.id === operationId);
    return this.execOperations[idx];
  }

  public ngOnDestroy(): void {
    this.executedOperationResultSubscription.unsubscribe();
  }
}
