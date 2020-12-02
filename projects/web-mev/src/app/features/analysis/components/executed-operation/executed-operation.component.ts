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
  selectedExecOperation: string;
  data;

  @Input() execOperationId: string;
  outputs;
  isInProgress: boolean;

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
        }),
        switchMap(() => {
          if (this.execOperationId) {
            this.selectedExecOperation = this.execOperationId;
            const idx = this.execOperations.findIndex(
              val => val.id === this.execOperationId
            );
            // if the opertion has been already completed, just extract its outputs from the operationa list
            if (
              this.execOperations[idx]?.outputs ||
              this.execOperations[idx]?.error_messages
            ) {
              this.outputs = {
                ...this.execOperations[idx].outputs,
                ...this.execOperations[idx].inputs,
                error_messages: this.execOperations[idx].error_messages
              };
              return of({ body: this.execOperations[idx] });
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
    this.execOperationId = this.selectedExecOperation;
    const idx = this.execOperations.findIndex(
      val => val.id === this.execOperationId
    );
    // if the operation has been already completed, just extract its outputs from the operationa list
    if (
      this.execOperations[idx].outputs ||
      this.execOperations[idx].error_messages
    ) {
      this.outputs = {
        ...this.execOperations[idx].outputs,
        ...this.execOperations[idx].inputs,
        error_messages: this.execOperations[idx].error_messages
      };
      this.isInProgress = false;
    } else {
      this.executedOperationResultSubscription = this.apiService
        .getExecutedOperationResult(this.execOperationId)
        .subscribe(response => {
          this.outputs = {
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

  public ngOnDestroy(): void {
    this.executedOperationResultSubscription.unsubscribe();
  }
}
