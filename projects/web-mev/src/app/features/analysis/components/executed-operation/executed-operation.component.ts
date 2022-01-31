import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
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

/**
 * Flat node with expandable and level information
 */
interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

/**
 * Presentational states of operation execution process
 */
enum operationExecution {
  InProcess,
  RunningAnalysis,
  PreparingData,
  Finished
}

/**
 * Executed Operation Component
 * used for displaying the list of executed operations (tree) and their results
 */

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
  operationExecutionStateType = operationExecution;
  operationExecutionState: operationExecution;
  categories = new Set();
  subcategories = [];
  resultPaneVisible: boolean = true;

  isTreePanelCollapsed = false;
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
    private apiService: AnalysesService,
    public cdRef: ChangeDetectorRef
  ) {}

  /**
   * Initialize the datasource for the Operation Tree
   */
  ngOnInit(): void {
    const operationTree = {};
    const workspaceId = this.route.snapshot.paramMap.get('workspaceId');
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
            operationTreeArr.sort(function(a, b) {
              var nameA = a.name.toUpperCase();
              var nameB = b.name.toUpperCase();
              if (nameA < nameB) {
                return -1;
              }
              if (nameA > nameB) {
                return 1;
              }
              return 0;
            });
            this.dataSource.data = operationTreeArr.sort();
          });
        }),
        switchMap(() => {
          if (this.execOperationId) {
            this.operationExecutionState = operationExecution.InProcess;

            this.selectedExecOperationId = this.execOperationId;
            const execOperation = this.getExecOperationByOperationId(
              this.execOperationId
            );

            if(execOperation){
              // expand the parent nodes if there is an operation selected
              const nodesToExpand = [
                execOperation.operation.operation_name,
                ...execOperation.operation.categories
              ];
              this.treeControl.dataNodes.forEach((node, i) => {
                if (nodesToExpand.includes(node.name)) {
                  this.treeControl.expand(this.treeControl.dataNodes[i]);
                }
              });
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
          }
          return of();
        })
      )
      .subscribe((response: any) => {
        this.updateOperationExecutionState(response.status);
        this.outputs = {
          operation: response?.body?.operation,
          job_name: response?.body?.job_name,
          ...response?.body?.outputs,
          ...response?.body?.inputs,
          error_messages: response?.body?.error_messages
        };
      });
  }

  /**
   * Find the operation data by OperationID
   */
  getOutputs(operationId) {
    const idx = this.execOperations.findIndex(val => val.id === operationId);
    return this.execOperations[idx].outputs;
  }

  /**
   * Function is triggered when the user selects an operation in the tree
   */
  onSelectExecOperation(execOperation) {

    // These next two lines force the change detection cycle to 're-initiate' 
    // the component that displays the results. If this is not done, then clicking
    // between two result pages of the same type (e.g. looking at the results of
    // two subsetting operations) will not change the underlying component instance, which prevents us from 
    // performing logic/setup in the ngOnInit, etc. methods as we might expect. As a result, some
    // result page elements could be stale (e.g. show page components that correspond
    // with the other analysis operation). By changing this variable (and requesting a change
    // detection), the HTML page will re-render the whole hierarchy inside of 
    // the <mev-analysis-result> component
    this.resultPaneVisible = false;
    this.cdRef.detectChanges();
    this.activeNode = execOperation;
    this.operationExecutionState = operationExecution.InProcess;

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
      this.operationExecutionState = operationExecution.Finished;
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

          this.updateOperationExecutionState(response.status);
        });
    }
    this.resultPaneVisible = true;
  }

  /**
   * Update the operation execution state depending on the server response
   */
  updateOperationExecutionState(status) {
    if (status === 204) {
      this.operationExecutionState = operationExecution.RunningAnalysis;
    } else if (status === 202 || status === 208) {
      this.operationExecutionState = operationExecution.PreparingData;
    } else {
      this.operationExecutionState = operationExecution.Finished;
      this.execOperations.filter(
        op => op.id === this.execOperationId
      )[0].execution_stop_datetime = new Date();
    }
  }

  /**
   * Function to check if an operation failed
   */
  isOperationFailed(operation): boolean {
    return operation.job_failed;
  }

  /**
   * Function to check if an operation is still executing
   */
  isOperationExecuting(operation): boolean {
    if (operation.execution_stop_datetime) return false;

    // if execution_stop_datetime is null, check if the list of operations has an updated value
    const arr = this.execOperations.filter(op => op.id === operation.id);
    if (arr.length) {
      return !arr[0].execution_stop_datetime;
    }
    return true;
  }

  getExecOperationByOperationId(operationId: string) {
    const idx = this.execOperations.findIndex(val => val.id === operationId);
    return this.execOperations[idx];
  }

  public ngOnDestroy(): void {
    this.executedOperationResultSubscription.unsubscribe();
  }

  /**
   * Control if the left side panel is collapsed or expanded
   */
  toggleTreePanel(): void {
    this.isTreePanelCollapsed = !this.isTreePanelCollapsed;
  }
}
