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
            return this.showOperationResult(this.execOperationId);
          }
          return of();
        })
      )
      .subscribe(response => {
        this.execOperationResult = response;
      });
  }

  showOperationResult(operationId) {
    const idx = this.execOperations.findIndex(val => val.id === operationId);
    const output = this.execOperations[idx].outputs;

    if (true || output?.pca_coordinates) {
      // TO UPDATE
      return this.showPCAResult();
    } else if (output?.dge_results) {
      return this.showDeseq2Result();
    }
    return of();
  }

  showPCAResult() {
    return this.apiService.getPCACoordinates(this.execOperationId);
  }

  showDeseq2Result() {
    return this.apiService.getDeseq2Features(123);
  }

  onSelectExecOperation() {
    this.execOperationId = this.selectedExecOperation;
    this.showOperationResult(this.selectedExecOperation).subscribe(response => {
      this.execOperationResult = response;
    });
  }
}
