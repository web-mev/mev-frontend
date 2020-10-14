import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnalysesService } from '../../services/analysis.service';

@Component({
  selector: 'mev-executed-operation',
  templateUrl: './executed-operation.component.html',
  styleUrls: ['./executed-operation.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ExecutedOperationComponent implements OnInit {
  // execOperationId: string;
  execOperationResult;
  data;

  @Input() execOperationId: string;

  constructor(
    private route: ActivatedRoute,
    private apiService: AnalysesService
  ) {}

  ngOnInit(): void {
    // this.execOperationId = this.route.snapshot.paramMap.get(
    //   'executedOperationId'
    // );
    if (this.execOperationId) {
      this.apiService
        .getPCACoordinates(this.execOperationId)
        .subscribe(response => {
          this.execOperationResult = response;
        });
    }
  }
}
