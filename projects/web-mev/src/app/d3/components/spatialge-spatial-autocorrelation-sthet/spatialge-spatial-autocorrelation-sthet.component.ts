import { Component, OnInit, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/table';
import { CustomSetType } from '@app/_models/metadata';
import { MatDialog } from '@angular/material/dialog';
import { AddSampleSetComponent } from '../dialogs/add-sample-set/add-sample-set.component';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { NotificationService } from '../../../core/core.module';
import { ActivatedRoute } from '@angular/router';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component';
import { catchError } from "rxjs/operators";
import { forkJoin } from 'rxjs';

@Component({
    selector: 'mev-spatialge-spatial-autocorrelation-sthet',
    templateUrl: './spatialge-spatial-autocorrelation-sthet.component.html',
    styleUrls: ['./spatialge-spatial-autocorrelation-sthet.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGESpatialAutocorrelationSthetComponent extends BaseSpatialgeComponent implements OnInit {
    @Input() outputs;
    @ViewChild(MatPaginator) paginator: MatPaginator;

    dataSource: FeaturesDataSource;
    resourceId;
    analysisName = 'SpatialGE Spatial Autocorrelation (STHET)';
    displayedColumns = ['sample_gene', 'gene_mean', 'gene_stdevs', 'moran_i', 'geary_c', 'actions'];
    defaultPageIndex = 0;
    defaultPageSize = 10;
    maxFeatureSetSize = 500;
    stNormalizeFile = [];
    workspaceId = '';

    xAxisValue: string = '';
    yAxisValue: string = ''
    xAxisValueList: string[] = [];
    yAxisValueList: string[] = [];

    geneSearch: string = 'ENSMUSG00000025903';
    geneSearchVal: string = 'ENSMUSG00000025903';

    // constructor(
    //     private route: ActivatedRoute,
    //     private apiService: AnalysesService,
    //     // private metadataService: MetadataService,
    //     private analysesService: AnalysesService,
    //     public dialog: MatDialog,
    //     // private readonly notificationService: NotificationService
    // ) {
    //     this.dataSource = new FeaturesDataSource(this.analysesService);
    // }

    ngOnInit() {
        console.log("outputs: ", this.outputs)
        this.dataSource = new FeaturesDataSource(this.analysesService);
        this.initializeFeatureResource();
        this.getListNormalizeFiles();


    }

    initializeFeatureResource(): void {
        this.resourceId = this.outputs['SThet_results'];
        this.dataSource.loadFeatures(
            this.resourceId,
            {},
            {},
            this.defaultPageIndex,
            this.defaultPageSize
        );
        console.log("datasource2: ", this.dataSource)

    }
    selectedStNormalizedFile = {}

    getListNormalizeFiles() {
        this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
        this.apiService.getExecOperations(this.workspaceId).subscribe(res => {
            for (let file of res) {
                if (file['operation']['operation_name'] === 'spatialGE normalization') {
                    this.stNormalizeFile.push(file)
                    console.log("found: ", file)
                }
            }
        })
    }

    loadFeaturesPage() {
        this.dataSource.loadFeatures(
            this.resourceId,
            {},
            {},
            this.paginator.pageIndex,
            this.paginator.pageSize
        );
    }

    geneSelected = false

    selectGene(gene) {
        console.log("gene: ", gene)
        this.geneSearchVal = gene;
        this.geneSelected = true;
        this.getAxisColumnNamesSthet();
        console.log("selected job", this.selectedStNormalizedFile)

    }

    getAxisColumnNamesSthet() {
        this.isLoading = true;
        let coords_metadata_uuid = this.selectedStNormalizedFile['inputs']["coords_metadata"]
        this.httpClient.get(`${this.API_URL}/resources/${coords_metadata_uuid}/contents/?page=1&page_size=1`).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
                console.log("some error from coord: ", error)
                throw error;
            })
        ).subscribe(res => {
            this.isLoading = false;
            let jsonObj = res['results'][0]['values']
            const keys = Object.keys(jsonObj);
            this.xAxisValueList = keys;
            this.yAxisValueList = keys;
        })
    }

    getDataNormalizationSthet() {
        this.displayOverlayContainer = true;
        this.showMiniMap = true;
        this.geneSearch = this.geneSearchVal.split('').map(letter => letter.toUpperCase()).join('');
        this.geneSearchHeight = 100;
        this.useNormalization = true;
        this.useCluster = false;
        this.isLoading = true;
        this.panelOpenState = false;
        this.scrollTo('topOfPage');
        this.resetAllVariables();

        // let normalization_uuid = this.outputs["normalized_expression"];
        // let coords_metadata_uuid = this.outputs["coords_metadata"];
        let normalization_uuid = this.selectedStNormalizedFile['outputs']["normalized_expression"];
        let coords_metadata_uuid = this.selectedStNormalizedFile['inputs']["coords_metadata"];
        let normUrl = `${this.API_URL}/resources/${normalization_uuid}/contents/?__rowname__=[eq]:${this.geneSearch}`;

        const normRequest = this.httpClient.get(normUrl).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from normalized expression request.`);
                console.log("some error message from norm: ", error)
                throw error;
            })
        );

        let coordMetaUrl = `${this.API_URL}/resources/${coords_metadata_uuid}/contents/`;
        const coordsMetadataRequest = this.httpClient.get(coordMetaUrl).pipe(
            catchError(error => {
                this.isLoading = false;
                this.notificationService.error(`Error ${error.status}: Error from coordinates metadata request.`);
                console.log("some error from coord: ", error)
                throw error;
            })
        );

        forkJoin([normRequest, coordsMetadataRequest]).subscribe(([normRes, coordsMetadataRes]) => {
            this.isLoading = false;
            if (Array.isArray(normRes) && normRes.length > 0 && normRes[0].hasOwnProperty('values')) {
                for (let i in normRes[0]['values']) {
                    let key = i;
                    let count = normRes[0]['values'][i];
                    this.dataDict[key] = {
                        ...this.dataDict[key],
                        count
                    };
                }

                for (let i in coordsMetadataRes) {
                    let obj = coordsMetadataRes[i];
                    let key = obj['rowname'];
                    let xVal = obj['values'][this.xAxisValue];
                    let yVal = obj['values'][this.yAxisValue];

                    this.dataDict[key] = {
                        ...this.dataDict[key],
                        xVal,
                        yVal
                    };
                }

                for (let i in this.dataDict) {
                    const parsedX = parseInt(this.dataDict[i]['xVal'])
                    const parsedY = parseInt(this.dataDict[i]['yVal'])
                    const totalCounts = parseFloat(parseFloat(this.dataDict[i]['count']).toFixed(3));

                    if (this.dataDict[i]['xVal'] !== undefined && this.dataDict[i]['yVal'] !== undefined && this.dataDict[i]['count'] !== undefined && !isNaN(parsedX) && !isNaN(parsedY) && !isNaN(totalCounts)) {
                        let temp = {
                            "xValue": parsedX,
                            "yValue": parsedY,
                            "totalCounts": totalCounts
                        }
                        let keyName = parsedX + "_" + parsedY
                        this.totalCounts[keyName] = totalCounts
                        this.scatterPlotData.push(temp)

                        this.xMin = Math.min(this.xMin, parsedX);
                        this.xMax = Math.max(this.xMax, parsedX);

                        this.yMin = Math.min(this.yMin, parsedY);
                        this.yMax = Math.max(this.yMax, parsedY);

                        this.totalCountsMax = Math.max(this.totalCountsMax, totalCounts)
                        this.totalCountsMin = Math.min(this.totalCountsMin, totalCounts)
                    }
                }
                // let normalizePlot = (this.xMax - this.xMin) > (this.yMax - this.yMin) ? (this.xMax - this.xMin) / this.normalizePlotWidth : (this.yMax - this.yMin) / this.normalizePlotWidth

                let normalizePlot = (this.xMax - this.xMin) / this.normalizePlotWidth // This will set the plot to a width of 300px
                this.plotWidth = (this.xMax - this.xMin) / normalizePlot;
                this.plotHeight = (this.yMax - this.yMin) / normalizePlot;

                this.imageOverlayOffset = this.plotWidth - this.legendWidth

                if (this.originalPlotWidth === 0) {
                    this.originalPlotWidth = this.plotWidth;
                    this.originalPlotHeight = this.plotHeight;
                }

                let selectionRectWidth = this.plotWidth / (4 * this.currentZoomVal);
                let selectionRectHeight = this.plotHeight / (4 * this.currentZoomVal);

                this.selectionRectStyle = {
                    top: `-${0}px`,
                    left: `-${0}px`,
                    width: `${selectionRectWidth}px`,
                    height: `${selectionRectHeight}px`,
                    border: '2px solid #1DA1F2',
                    position: 'absolute',
                };

                if (this.scatterPlotData.length > 0) {
                    this.displayOverlayContainer = true;
                    this.callCreateScatterPlot();
                }

            }

            else {
                this.displayOverlayContainer = false;
            }
        });
    }
    isEmpty(obj: any): boolean {
        return obj && Object.keys(obj).length === 0;
      }
}

export interface SPEFeature {
    sample_gene: string;
    gene_mean: number;
    gene_stdevs: number;
    moran_i: number;
    geary_c: number;
}

export class FeaturesDataSource implements DataSource<SPEFeature> {
    public featuresSubject = new BehaviorSubject<SPEFeature[]>([]);
    public featuresCount = 0;
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    constructor(private analysesService: AnalysesService) { }

    loadFeatures(
        resourceId: string,
        filterValues: object,
        sorting: object,
        pageIndex: number,
        pageSize: number
    ) {
        this.loadingSubject.next(true);
        this.analysesService
            .getResourceContent(
                resourceId,
                pageIndex + 1,
                pageSize,
                filterValues,
                sorting
            )
            .pipe(finalize(() => this.loadingSubject.next(false)))
            .subscribe(features => {
                this.featuresCount = features.count;
                const featuresFormatted = features.results;
                return this.featuresSubject.next(featuresFormatted);
            });
    }

    connect(): Observable<SPEFeature[]> {
        return this.featuresSubject.asObservable();
    }

    disconnect(): void {
        this.featuresSubject.complete();
        this.loadingSubject.complete();
    }
}

