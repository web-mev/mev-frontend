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
    boxplotData = [];
    showBoxplot = false;

    constructor(
        private httpClient: HttpClient
    ) { }


    ngOnInit(): void {
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
        console.log("SampleID to group: ", this.sampleIdToGroup)
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
                this.isLoading = false;
                for (let i in data) {
                    if (parseInt(i) < 6) {
                        let temp = {
                            gene: data[i]['rowname'],
                            baseMean: data[i]['values']['baseMean'],
                            log2FoldChange: data[i]['values']['log2FoldChange'],
                            statistic: data[i]['values']['statistic'],
                            pvalue: data[i]['values']['pvalue'],
                            padj: data[i]['values']['padj'],

                        }
                        this.dataSource.push(temp)
                        for (let name in data[i]['values']) {
                            if (name !== 'baseMean' && name !== 'log2FoldChange' && name !== 'statistic' && name !== 'pvalue' && name !== 'padj') {
                                let temp = {
                                    name: name ,
                                    key: data[i]['rowname'] + "_" + this.sampleIdToGroup[name],
                                    value: data[i]['values'][name],
                                    group: this.sampleIdToGroup[name],
                                    gene: data[i]['rowname']

                                }
                                this.boxplotData.push(temp);
                            }
                        }
                    }
                }

                this.showBoxplot = true;
            });
    }
    boxplotDataArr = [];

    handlePageEvent(details) {
        this.pageIndex = details.pageIndex
        this.limit = details.pageSize
    }
}