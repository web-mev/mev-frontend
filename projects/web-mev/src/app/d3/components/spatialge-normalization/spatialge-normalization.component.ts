import { Component, ChangeDetectionStrategy, Input, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { NotificationService } from '@core/core.module';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component'

interface ScatterData {
    xValue: number;
    yValue: number;
    totalCounts: number;
}

@Component({
    selector: 'mev-spatialge-normalization',
    templateUrl: './spatialge-normalization.component.html',
    styleUrls: ['./spatialge-normalization.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGENormalizationComponent extends BaseSpatialgeComponent implements OnInit {

    ngOnInit(): void {
        this.getDataNormalization()
    }
}