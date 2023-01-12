import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
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
    pageIndex = 1;
    limit = 5;
    lfc_comparison = '';
    private readonly API_URL = environment.apiUrl;
    sampleIdToGroup = {};
    boxplotData = [];
    showBoxplot = false;
    tableDataLength = 0;
    dge_results
    currPageIndex = 1;
    currLimit = 5;

    constructor(
        private httpClient: HttpClient
    ) { }

    ngOnInit(): void {
        this.createSample2GroupDict()
        this.lfc_comparison = this.outputs['lfc_comparison']
        this.dge_results = this.outputs['dge_results'];
        this.getData(this.dge_results);
    }

    createSample2GroupDict() {
        let categories = this.outputs['sample_to_group_mapping']
        for (let item in categories) {
            let categoryArr = categories[item]
            for (let index in categoryArr) {
                this.sampleIdToGroup[categoryArr[index]] = item
            }
        }
    }

    getData(uuid) {
        this.isLoading = true;
        let queryURL = `${this.API_URL}/resources/${uuid}/contents/?page=${this.currPageIndex}&page_size=${this.currLimit}`;
        this.boxplotData = [];
        this.httpClient.get(queryURL).pipe(
            catchError(error => {
                console.log("Error: ", error.message);
                let message = `Error: ${error.error.error}`;
                throw message
            }))
            .subscribe(data => {
                this.tableDataLength = data['count'];
                this.isLoading = false;
                
                for (let i in data['results']) {
                    let temp = {
                        gene: data['results'][i]['rowname'],
                        baseMean: data['results'][i]['values']['baseMean'],
                        log2FoldChange: data['results'][i]['values']['log2FoldChange'],
                        statistic: data['results'][i]['values']['statistic'],
                        pvalue: data['results'][i]['values']['pvalue'],
                        padj: data['results'][i]['values']['padj'],
                    }
                    this.dataSource.push(temp)
                    for (let name in data['results'][i]['values']) {
                        if (name !== 'baseMean' && name !== 'log2FoldChange' && name !== 'statistic' && name !== 'pvalue' && name !== 'padj') {
                            let temp = {
                                name: name,
                                key: data['results'][i]['rowname'] + "_" + this.sampleIdToGroup[name],
                                value: data['results'][i]['values'][name],
                                group: this.sampleIdToGroup[name],
                                gene: data['results'][i]['rowname']
                            }
                            this.boxplotData.push(temp);
                        }
                    }
                }
                this.showBoxplot = true;
                this.pageIndex = this.currPageIndex;
                this.limit = this.currLimit;
            });
    }

    handlePageEvent(details) {
        this.currLimit = details.pageSize;

        if(details.pageSize !== this.limit){
            this.currPageIndex = 1;
            this.dataSource = [];
        }else{
            this.currPageIndex = details.pageIndex +1;
        }

        this.getData(this.dge_results)
    }

}