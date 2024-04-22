import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  OnChanges,
  ViewChild
} from '@angular/core';
import { AnalysesService } from '../../services/analysis.service';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Observable } from 'rxjs';
import { Operation } from '../../models/operation';
import { BaseOperationInput } from '../base-operation-inputs/base-operation-inputs';
import { DefaultOperationComponent } from '../default-operation-inputs/default-operation-inputs.component';
/**
 * Operation Component
 * used for displaying the input parameters of an operation
 */
@Component({
  selector: 'mev-operation',
  templateUrl: './operation.component.html',
  styleUrls: ['./operation.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class OperationComponent implements OnChanges {
  submitted = false;

  @ViewChild(BaseOperationInput) opInput!: BaseOperationInput

  @Input() workspaceId: string;
  @Input() workspace$: Observable<Workspace>;
  @Input() operation: Operation;

  @Output() executedOperationId: EventEmitter<any> = new EventEmitter<any>();

  operationData;
  customInput;

  constructor(
    private apiService: AnalysesService,
  ) {}

  ngOnChanges(): void {
    this.loadData();
  }

    /**
   * Load operation data before creating form controls
   */
     loadData() {
      this.apiService.getOperation(this.operation.id).subscribe(data => {
        console.log(data)
        this.operationData = data;
        console.log(this.operationData.name)
        if(this.operationData.name == 'DESeq2'){
          console.log('set to true')
          this.customInput = true;
        } else {
          console.log('set to false')
          this.customInput = false;
        }
      });
    }

    public showExecutedOperationResult(data: any) {
      this.executedOperationId.emit(data);
    }

    startAnalysis() {
      console.log('clicked start analysis');
      let data = this.opInput.getInputData();
      console.log('Data is', data);
    }
  
}
