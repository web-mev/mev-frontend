import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError } from "rxjs/operators";

@Component({
    selector: 'mev-puma',
    templateUrl: './puma.component.html',
    styleUrls: ['./puma.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class PumaComponent implements OnInit {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;

    constructor(
        private apiService: AnalysesService,
        private httpClient: HttpClient
    ) {

    }

    ngOnInit(): void {
        console.log("puma: ", this.outputs)
        let pumaOutputMatrix = this.outputs['MevPuma.puma_output_matrix'];
        this.getData(pumaOutputMatrix).subscribe(res => {
            console.log("puma output matrix: ", res)
        });
    }

    selectedLayers = 2;
    selectedChildren = 3;
    apiAxis = 0;

    getData(uuid) {
        let endPoint = `${this.API_URL}/resources/${uuid}/contents/transform/?transform-name=pandasubset&maxdepth=${this.selectedLayers}&children=${this.selectedChildren}&axis=${this.apiAxis}`;
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    let message = `Error: ${error.error.error}`
                    // this.notificationService.warn(message)
                    // this.isLoading = false;
                    throw error;
                }))
    }
}