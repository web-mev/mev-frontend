import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
// import { NotificationService } from '@core/notifications/notification.service';
// import * as d3 from 'd3';
// import d3Tip from 'd3-tip';
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
    limit = 10;
    lfc_comparison = '';
    private readonly API_URL = environment.apiUrl;
    sampleIdToGroup = {};
    boxplotData = {};
    boxplotData_test = [1,2,3,4,5,6,7,7,4,3,23,66,2,3]

    constructor(
        private httpClient: HttpClient,
        // private readonly notificationService: NotificationService,
    ) { }


    ngOnInit(): void {
        console.log("outputs: ", this.outputs)
        this.createSample2GroupDict()
        this.lfc_comparison = this.outputs['lfc_comparison']
        let dge_results = this.outputs['dge_results'];
        this.getData(dge_results);

    }

    createSample2GroupDict() {
        let categories = this.outputs['sample_to_group_mapping']
        for (let item in categories) {
            let categoryArr = categories[item]
            for (let index in categoryArr) {
                this.sampleIdToGroup[categoryArr[index]] = item
            }
        }
        console.log("sampleID to Group: ", this.sampleIdToGroup)
    }



    getData(uuid) {
        this.isLoading = true;
        let queryURL = `${this.API_URL}/resources/${uuid}/contents/`;
        this.httpClient.get(queryURL).pipe(
            catchError(error => {
                console.log("Error: ", error.message);
                let message = `Error: ${error.error.error}`;
                throw message
            }))
            .subscribe(data => {
                console.log("data: ", data)
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
                for (let i in data) {
                    let rowname = data[i]['rowname']
                    if (this.boxplotData[rowname] === undefined) {
                        this.boxplotData[rowname] = {}
                    }

                    for (let index in data[i]['values']) {
                        if (this.sampleIdToGroup[index] !== undefined) {
                            let cat = this.sampleIdToGroup[index]
                            if (this.boxplotData[rowname][cat] === undefined) {
                                this.boxplotData[rowname][cat] = [];
                            }
                            let value = data[i]['values'][index]
                            this.boxplotData[rowname][cat].push(value)
                        }
                    }
                }
                console.log("boxplot data: ", this.boxplotData)

            });
    }

    handlePageEvent(details) {
        this.pageIndex = details.pageIndex
        this.limit = details.pageSize
    }
}