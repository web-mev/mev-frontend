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
import { MatSort } from '@angular/material/sort';

@Component({
    selector: 'mev-spatialge-pathway-enrichment',
    templateUrl: './spatialge-pathway-enrichment.component.html',
    styleUrls: ['./spatialge-pathway-enrichment.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class SpatialGEPathwayEnrichmentComponent implements OnInit {
    @Input() outputs;
    @ViewChild(MatPaginator) paginator: MatPaginator;

    dataSource: FeaturesDataSource;
    resourceId;
    analysisName = 'SpatialGE Pathway Enrichment';
    displayedColumns = ['pathway', 'padj', 'pval', 'size', 'actions'];
    defaultPageIndex = 0;
    defaultPageSize = 10;
    maxFeatureSetSize = 500;

    constructor(
        private metadataService: MetadataService,
        private analysesService: AnalysesService,
        public dialog: MatDialog,
        private readonly notificationService: NotificationService
    ) {
        this.dataSource = new FeaturesDataSource(this.analysesService);
    }

    ngOnInit() {
        this.initializeFeatureResource();
    }

    initializeFeatureResource(): void {
        this.resourceId = this.outputs['STEnrich.pathway_results'];
        const sorting = {}

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

    onCreateCustomFeatureSet(row) {
        const setSize = row.size;
        if (setSize > this.maxFeatureSetSize) {
            const errorMessage = `The current size of 
          your set (${setSize}) is larger than the 
          maximum allowable size (${this.maxFeatureSetSize}).
          Please filter the table further to reduce the size.`
            this.notificationService.error(errorMessage);
            return;
        }

        const dialogRef = this.dialog.open(AddSampleSetComponent, {
            data: { type: CustomSetType.FeatureSet }
        });

        dialogRef.afterClosed().subscribe(customSetData => {
            if (customSetData) {
                const elements = [];
                    for (let gene of row.genes) {
                        let temp = { id: gene }
                        elements.push(temp)
                    }

                const customSet = {
                    name: customSetData.name,
                    color: customSetData.color,
                    type: CustomSetType.FeatureSet,
                    elements: elements,
                    multiple: true
                };

                this.metadataService.addCustomSet(customSet);
            }

        });
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
}

export interface SPEFeature {
    pathway: string;
    padj: number;
    pval: number;
    size: number;
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

