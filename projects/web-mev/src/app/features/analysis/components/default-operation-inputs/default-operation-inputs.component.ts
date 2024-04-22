import {
    Component,
    ChangeDetectionStrategy,
    Input,
    EventEmitter,
    Output,
    OnChanges,
  } from '@angular/core';
  import { AnalysesService } from '../../services/analysis.service';
  import { Workspace } from '@app/features/workspace-manager/models/workspace';
  import { Observable } from 'rxjs';
  import { Operation } from '../../models/operation';
  
  /**
   * Operation Component
   * used for displaying the input parameters of an operation
   */
  @Component({
    selector: 'default-operation-inputs',
    templateUrl: './default-operation-inputs.component.html',
    styleUrls: ['./default-operation-inputs.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
  })
  export class DefaultOperationComponent implements OnChanges {
    submitted = false;
  
    @Input() workspaceId: string;
    @Input() workspace$: Observable<Workspace>;
    @Input() operationData: any;
  
    @Output() executedOperationId: EventEmitter<any> = new EventEmitter<any>();
    
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
        console.log('in default inputs')
      }
  
      public showExecutedOperationResult(data: any) {
        this.executedOperationId.emit(data);
      }
    
  }
  