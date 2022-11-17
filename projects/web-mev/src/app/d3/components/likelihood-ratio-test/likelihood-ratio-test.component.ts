import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { NotificationService } from '@core/notifications/notification.service';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'mev-likelihood-ratio-test',
    templateUrl: './likelihood-ratio-test.component.html',
    styleUrls: ['./likelihood-ratio-test.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})



export class LikelihoodRatioTestComponent implements OnInit {
    @Input() outputs;
    isLoading = false;
    displayedColumns: string[] = ['gene', 'baseMean', 'log2FoldChange', 'statistic', 'pvalue', 'padj'];
    dataSource = [];
    pageIndex = 0;
    limit = 25;
    lfc_comparison = '';
    private readonly API_URL = environment.apiUrl;

    constructor(
        private httpClient: HttpClient,
        private readonly notificationService: NotificationService,
    ) { }


    ngOnInit(): void {
        console.log("outputs: ", this.outputs)
        this.lfc_comparison = this.outputs['lfc_comparison']
        let dge_results = this.outputs['dge_results'];
        this.getData(dge_results);
    }

    getData(uuid) {
        this.isLoading = true;
        let queryURL = `${this.API_URL}/resources/${uuid}/contents/`
        this.httpClient.get(queryURL).pipe(
            catchError(error => {
                console.log("Error: ", error.message);
                let message = `Error: ${error.error.error}`;
                throw message
            }))
            .subscribe(data => {
                this.isLoading = false;
                for (let i in data) {
                    let temp = {
                        gene: data[i]['rowname'],
                        baseMean: data[i]['values']['baseMean'],
                        log2FoldChange: data[i]['values']['log2FoldChange'],
                        statistic: data[i]['values']['statistic'],
                        pvalue: data[i]['values']['pvalue'],
                        padj: data[i]['values']['padj'],

                    }
                    this.dataSource.push(temp)
                }
                console.log("datasource: ", this.dataSource)

            });
    }

    handlePageEvent(details) {
        this.pageIndex = details.pageIndex
        this.limit = details.pageSize
    }
}