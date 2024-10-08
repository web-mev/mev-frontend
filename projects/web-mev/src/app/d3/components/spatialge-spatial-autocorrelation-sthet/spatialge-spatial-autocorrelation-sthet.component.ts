import { Component, OnInit, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { AnalysesService } from '@app/features/analysis/services/analysis.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/table';
import { BaseSpatialgeComponent } from '../base-spatialge/base-spatialge.component';
import { catchError } from "rxjs/operators";
import { forkJoin } from 'rxjs';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { MatSort } from '@angular/material/sort';

@Component({
    selector: 'mev-spatialge-spatial-autocorrelation-sthet',
    templateUrl: './spatialge-spatial-autocorrelation-sthet.component.html',
    styleUrls: ['./spatialge-spatial-autocorrelation-sthet.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGESpatialAutocorrelationSthetComponent extends BaseSpatialgeComponent implements OnInit {
    @Input() outputs;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

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

    geneSearch: string = '';
    geneSelected = false;

    rawCountsForOutput = '';

    selectedStNormalizedFile = {};
    moranISort = { field: 'moran_i', direction: 'desc' };
    gearyCSort = { field: 'geary_c', direction: 'asc' };
    defaultSorting;

    ngOnInit() {
        this.xAxisValue = this.outputs['ypos_col']
        this.yAxisValue = this.outputs['xpos_col']
        this.rawCountsForOutput = this.outputs['raw_counts']
        this.defaultSorting = this.outputs['stat_method'] === "Moran's I" ? this.moranISort : this.gearyCSort
        this.dataSource = new FeaturesDataSource(this.analysesService);

        this.panelOpenState = true;
        this.initializeFeatureResource();
        this.getListNormalizeFiles();

        if (this.outputs['stat_method'] === "Moran's I") {
            this.displayedColumns = ['sample_gene', 'gene_mean', 'gene_stdevs', 'moran_i', 'actions'];
        } else {
            this.displayedColumns = ['sample_gene', 'gene_mean', 'gene_stdevs', 'geary_c', 'actions'];
        }

    }

    initializeFeatureResource(): void {
        this.resourceId = this.outputs['SThet_results'];

        const sorting = {
            sortField: this.defaultSorting.field,
            sortDirection: this.defaultSorting.direction
        };

        this.dataSource.loadFeatures(
            this.resourceId,
            {},
            sorting,
            this.defaultPageIndex,
            this.defaultPageSize
        );
    }

    sortData(sort: MatSort) {
        const sorting = {
            sortField: sort.active,
            sortDirection: sort.direction
        };

        this.dataSource.loadFeatures(
            this.resourceId,
            {},
            sorting,
            this.defaultPageIndex,
            this.defaultPageSize
        );
    }

    getListNormalizeFiles() {
        this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');
        this.apiService.getExecOperations(this.workspaceId).subscribe(res => {
            for (let file of res) {
                let rawCountsForNormFile = file['inputs']['raw_counts']
                let jobFailed = file['job_failed']
                if (file['operation']['operation_name'] === 'spatialGE normalization' && rawCountsForNormFile === this.rawCountsForOutput && !jobFailed) {
                    this.stNormalizeFile.push(file)
                }
            }

            if (this.stNormalizeFile.length === 1) {
                this.selectedStNormalizedFile = this.stNormalizeFile[0]
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
        this.isLoading = true;
        this.scrollTo('topOfPage');
        this.resetAllVariables();

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
                let normalizePlot = (this.xMax - this.xMin) / this.normalizePlotWidth // This will set the plot to a width of 300px
                this.plotWidth = (this.xMax - this.xMin) / normalizePlot;
                this.plotHeight = (this.yMax - this.yMin) / normalizePlot;

                if (this.originalPlotWidth === 0) {
                    this.originalPlotWidth = this.plotWidth;
                    this.originalPlotHeight = this.plotHeight;
                }

                if (this.scatterPlotData.length > 0) {
                    this.createScatterPlotSthet();
                }

            }
        });
    }

    createScatterPlotSthet() {
        var margin = { top: 0, right: 0, bottom: 0, left: this.legendWidth },
            width = this.plotWidth - margin.left - margin.right + this.legendWidth,
            height = this.plotHeight - margin.top - margin.bottom;

        let scatterplotContainerId = this.containerId;
        d3.select(scatterplotContainerId)
            .selectAll('svg')
            .remove();

        const pointTip = d3Tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html((event: any, d: any) => {
                let tipBox = `<div><div class="category">Normalized Count:</div> ${d.totalCounts}</div>`
                return tipBox
            });

        var svg = d3.select(scatterplotContainerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        svg.call(pointTip);

        const color = d3.scaleLinear<string>()
            .domain([0, this.totalCountsMax / 2, this.totalCountsMax])
            .range(["#4363d8", "#fffac8", "#e6194B"]);

        var x = d3.scaleLinear()
            .domain([this.xMin, this.xMax])
            .range([0, width]);

        var y = d3.scaleLinear()
            .domain([this.yMin, this.yMax])
            .range([height, 0]);

        const circles = svg.append('g')
            .selectAll("dot")
            .data(this.scatterPlotData)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.xValue) })
            .attr("cy", function (d) { return height - y(d.yValue); })
            .attr("r", 1.75)
            .attr("fill", d => {
                return color(d.totalCounts);
            })
            .on('mouseover', function (mouseEvent: any, d) {
                d3.select(this).style('cursor', 'pointer');
                pointTip.show(mouseEvent, d, this);
                pointTip.style('left', mouseEvent.x + 10 + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).style('cursor', 'default');  // Revert cursor to default on mouseout
                pointTip.hide();
            });


        // Add Legend
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "legendGradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#4363d8");

        gradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "#fffac8");

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", '#e6194B');

        const legendX = -this.legendWidth + 20;
        const legendY = 60;
        const borderWidth = 1;
        const legendBarWidth = 50;
        const legendBarHeight = 10;

        svg.append("rect")
            .attr("x", legendX - borderWidth)
            .attr("y", legendY - borderWidth)
            .attr("width", legendBarWidth + 2 * borderWidth)
            .attr("height", legendBarHeight + 2 * borderWidth)
            .style("stroke", "rgba(0, 0, 0, 0.3)")
            .style("fill", "none");

        // Create legend rectangle
        svg.append("rect")
            .attr("x", legendX)
            .attr("y", legendY)
            .attr("width", legendBarWidth)
            .attr("height", legendBarHeight)
            .style("fill", "url(#legendGradient)")

        svg.append("text")
            .attr("x", legendX)
            .attr("y", 80)
            .attr("text-anchor", "start")
            .attr("font-size", "6px")
            .text("0");

        const xmaxLabelWidth = this.totalCountsMax.toString().toLocaleString().length * 1;  // Adjust the font size multiplier as needed
        const adjustedXmaxLabelX = legendX + 60 - xmaxLabelWidth;

        svg.append("text")
            .attr("x", adjustedXmaxLabelX)
            .attr("y", 80)
            .attr("text-anchor", "end")
            .attr("font-size", "6px")
            .text(this.totalCountsMax.toLocaleString());

        svg.append("text")
            .attr("x", legendX)
            .attr("y", 50)
            .attr("text-anchor", "start")
            .attr("font-size", "6px")
            .attr("font-weight", "bold")
            .text("Counts");
    }

    isEmpty(obj: any): boolean {
        return obj && Object.keys(obj).length === 0;
    }

    formatNumToSigFig(value: number): string {
        const significantFigures: number = 5;
        if (isNaN(value) || isNaN(significantFigures)) {
            return value.toString();
        }
        return value.toPrecision(significantFigures);
    }

    selectGene(gene) {
        this.geneSearch = gene;
        this.geneSelected = true;
        this.scrollTo('topOfPage');

        if (this.xAxisValue !== '' && this.yAxisValue !== '') {
            this.getDataNormalizationSthet()
        } else {

            this.getAxisColumnNamesSthet();
        }
    }
    onSelectSTNormalizeFile() {
        this.geneSearch = '';
        this.geneSelected = false;

        d3.select(this.containerId)
            .selectAll('svg')
            .remove();
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

