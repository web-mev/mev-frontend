import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'mev-executed-operation',
  templateUrl: './executed-operation.component.html',
  styleUrls: ['./executed-operation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExecutedOperationComponent implements OnInit {
  execOperationId: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.execOperationId = this.route.snapshot.paramMap.get(
      'executedOperationId'
    );
  }
}
