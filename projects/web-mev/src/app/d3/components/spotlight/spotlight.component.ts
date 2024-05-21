import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from "rxjs/operators";
import { environment } from '@environments/environment';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { NotificationService } from '@core/core.module';
import html2canvas from 'html2canvas';
import { forkJoin } from 'rxjs';



@Component({
    selector: 'mev-spotlight',
    templateUrl: './spotlight.component.html',
    styleUrls: ['./spotlight.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpotlightComponent implements OnInit {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;

    isLoading = false;

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
    ) { }

    ngOnInit(): void {
        console.log("spotlight outputs: ", this.outputs)
        this.getData()
    }

    getData() {
        let coords_metadata_uuid = this.outputs["coords_metadata"];
        let deconvoluted_uuid = this.outputs["deconvoluted_output"];

        const spotlightRequest = this.httpClient.get(`${this.API_URL}/resources/${deconvoluted_uuid}/contents/`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from normalized expression request.`);
                console.log("some error message from norm: ", error)
                throw error;
            })
        );


        const coordsMetadataRequest = this.httpClient.get(`${this.API_URL}/resources/${coords_metadata_uuid}/contents/`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
                console.log("some error from coord: ", error)
                throw error;
            })
        );


        forkJoin([spotlightRequest, coordsMetadataRequest]).subscribe(([normRes, coordsMetadataRes]) => {
            console.log("res: ", normRes, coordsMetadataRes)
        })
    }
}