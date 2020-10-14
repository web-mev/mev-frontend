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

  @Output() executedOperationId: EventEmitter<any> = new EventEmitter<any>();

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
  }

  public showExecutedOperationResult(data: any) {
    this.executedOperationId.emit(data);
  }
}
