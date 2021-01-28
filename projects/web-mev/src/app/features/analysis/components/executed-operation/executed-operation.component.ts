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
  constructor(
    private route: ActivatedRoute,
    private apiService: AnalysesService
  ) {}

  ngOnInit(): void {
    const workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.isInProgress = true;
    this.executedOperationResultSubscription = this.apiService
      .getExecOperations(workspaceId)
      .pipe(
        tap(operations => {
          this.execOperations = operations;
          const operationsWithCategories = [];
          operations.forEach(execOperation => {
            const categories = execOperation.operation.categories;
            const operation = execOperation.operation.operation_name;
            categories.forEach(category => {
              this.categories.add(category);
              operationsWithCategories.push({
                operation_name: operation,
                category: category
              });
            });
            operationsWithCategories.map(x =>
              this.subcategories.filter(
                a =>
                  a.operation_name == x.operation_name &&
                  a.category == x.category
              ).length > 0
                ? null
                : this.subcategories.push(x)
            );
          });
        }),
        switchMap(() => {
          if (this.execOperationId) {
            this.selectedExecOperationId = this.execOperationId;
            const execOperation = this.getExecOperationByOperationId(
              this.execOperationId
            );
            this.selectedExecOperationName = execOperation.job_name;

            // if the opertion has been already completed, just extract its data from the list
            if (execOperation?.outputs || execOperation?.error_messages) {
              this.outputs = {
                operation: execOperation.operation,
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

  onSelectExecOperation() {
    this.isInProgress = true;
    this.executedOperationResultSubscription.unsubscribe();
    this.execOperationId = this.selectedExecOperationId;

    const execOperation = this.getExecOperationByOperationId(
      this.execOperationId
    );
    this.selectedExecOperationName = execOperation.job_name;

    // if the operation has been already completed, just extract its data from the list
    if (execOperation.outputs || execOperation.error_messages) {
      this.outputs = {
        operation: execOperation.operation,
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
