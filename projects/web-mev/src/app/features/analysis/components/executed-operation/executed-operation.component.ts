import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnalysesService } from '../../services/analysis.service';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'mev-executed-operation',
  templateUrl: './executed-operation.component.html',
  styleUrls: ['./executed-operation.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ExecutedOperationComponent implements OnInit {
  execOperationResult;
  data;

  @Input() execOperationId: string;
  execOperations;
  outputs;
  selectedExecOperation: string;

  constructor(
    private route: ActivatedRoute,
    private apiService: AnalysesService
  ) {}

  ngOnInit(): void {
    const workspaceId = this.route.snapshot.paramMap.get('workspaceId');
    this.apiService
      .getExecOperations(workspaceId)
      .pipe(
        tap(operations => {
          this.execOperations = operations;
        }),
        switchMap(() => {
          if (this.execOperationId) {
            this.selectedExecOperation = this.execOperationId;
            return this.apiService.getExecutedOperationResult(
              this.execOperationId
            ); //this.getOutputs(this.execOperationId);
          }
          return of();
        })
      )
      .subscribe(response => {
        this.outputs = {
          ...response?.body?.outputs,
          ...response?.body?.inputs
        };
      });
  }

  getOutputs(operationId) {
    const idx = this.execOperations.findIndex(val => val.id === operationId);
    return this.execOperations[idx].outputs;
  }

  onSelectExecOperation() {
    this.execOperationId = this.selectedExecOperation;
    const idx = this.execOperations.findIndex(
      val => val.id === this.execOperationId
    );
    // if the opertion has been already completed, just extract its outputs from the operationa list
    if (this.execOperations[idx].outputs) {
      this.outputs = {
        ...this.execOperations[idx].outputs,
        ...this.execOperations[idx].inputs
      };
    } else {
      this.apiService
        .getExecutedOperationResult(this.execOperationId)
        .subscribe(response => {
          this.outputs = {
            ...response?.body?.outputs,
            ...response?.body?.inputs
          };
        });
    }
  }
}
