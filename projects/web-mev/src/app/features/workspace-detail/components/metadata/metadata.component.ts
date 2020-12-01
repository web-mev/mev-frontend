import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, switchMap, filter, tap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatAccordion } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';

import { AddAnnotationDialogComponent } from './dialogs/add-annotation-dialog/add-annotation-dialog.component';
import { WorkspaceResource } from '../../models/workspace-resource';
import { WorkspaceDetailService } from '../../services/workspace-detail.service';
import { AddObservationSetDialogComponent } from './dialogs/add-observation-set-dialog/add-observation-set-dialog.component';
import { AddFeatureSetDialogComponent } from './dialogs/add-feature-set-dialog/add-feature-set-dialog.component';
import { DeleteSetDialogComponent } from './dialogs/delete-set-dialog/delete-set-dialog.component';
import { ViewSetDialogComponent } from './dialogs/view-set-dialog/view-set-dialog.component';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { EditFeatureSetDialogComponent } from './dialogs/edit-feature-set-dialog/edit-feature-set-dialog.component';
import { element } from 'protractor';

@Component({
  selector: 'mev-metadata',
  templateUrl: './metadata.component.html',
  styleUrls: ['./metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataComponent implements OnInit {
  displayedColumns = ['name', 'symbol'];
  displayedColumnsAttributesOnly = [];

  @ViewChild(MatAccordion) accordion: MatAccordion;
  @Input() workspaceResources: WorkspaceResource[];
  workspaceId: string;

  observationSetDS; // use in MatDataTable to display the current annotation
  metadataObsDisplayedColumns: string[]; // columns for the Current Annotation table
  metadataObsDisplayedColumnsAttributesOnly: string[];

  customSetDS; // use in MatDataTable to display the list of custom observation/feature sets created by user
  customSetsDisplayedColumns: string[] = ['name', 'type', 'actions']; // the list of columns for the Custom Sets table

  visObservationSetDS; // use in MatDataTable to display visualisation for custom observation sets
  visObsDisplayedColumns: string[];
  visObsDisplayedColumnsSetsOnly: string[];

  globalObservationSets = []; // all samples from all resources

  datasource;
  selection = new SelectionModel(true, []);
  private readonly onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  storageSubscription: Subscription;

  constructor(
    private service: WorkspaceDetailService,
    private metadataService: MetadataService,
    private storage: LclStorageService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog
  ) {}

  /**
   * Rename column headers in the Annotation table
   */
  renameAttrColHeader(newHeaderName: string, prevHeaderName: string) {
    if (newHeaderName && newHeaderName !== prevHeaderName) {
      const currentObsSet =
        JSON.parse(
          localStorage.getItem(this.workspaceId + '_current_observation_set')
        ) || [];
      currentObsSet.forEach(sample => {
        if (sample.attributes === undefined) {
          sample.attributes = {};
        }
        // attributes without any values are not stored,
        // so to keep the attribute column header renamed by the user
        // dummy values are added
        if (!sample.attributes.hasOwnProperty(prevHeaderName)) {
          sample.attributes[newHeaderName] = null;
        }
        if (
          sample.attributes &&
          sample.attributes.hasOwnProperty(prevHeaderName)
        ) {
          sample.attributes[newHeaderName] = sample.attributes[prevHeaderName];
          delete sample.attributes[prevHeaderName];
        }
      });

      this.generateMetadataColumns(currentObsSet);
      this.observationSetDS = new MatTableDataSource(currentObsSet);
      this.observationSetDS.paginator = this.paginator;
      localStorage.setItem(
        this.workspaceId + '_current_observation_set',
        JSON.stringify(currentObsSet)
      );
    }
  }

  /**
   * Add/update attribute value for a specific sample
   */
  updateAttrCellValue(
    newCellValue: string,
    columnName: string,
    rowIndex: number
  ) {
    if (newCellValue == null) {
      return;
    }

    const currentObsSet =
      JSON.parse(
        localStorage.getItem(this.workspaceId + '_current_observation_set')
      ) || [];

    if (!currentObsSet[rowIndex].attributes) {
      currentObsSet[rowIndex].attributes = {};
    }

    if (!currentObsSet[rowIndex].attributes[columnName]) {
      currentObsSet[rowIndex].attributes[columnName] = {};
    }
    currentObsSet[rowIndex].attributes[columnName].value = newCellValue;
    this.observationSetDS = new MatTableDataSource(currentObsSet);
    localStorage.setItem(
      this.workspaceId + '_current_observation_set',
      JSON.stringify(currentObsSet)
    );
    this.observationSetDS.paginator = this.paginator;
    this.cd.markForCheck();
  }

  /**
   * Add a new column to the Annotation table when user clicks the Plus sign
   */
  onAddAttribute() {
    const ix = this.metadataObsDisplayedColumnsAttributesOnly.length + 1;
    this.metadataObsDisplayedColumnsAttributesOnly.push(
      'New Column ' + ix + ' (click to rename)'
    );
    this.metadataObsDisplayedColumns.push(
      'New Column ' + ix + ' (click to rename)'
    );
  }

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');

    // check if there is a current annotation saved locally to display
    const currentObsSet =
      JSON.parse(
        localStorage.getItem(this.workspaceId + '_current_observation_set')
      ) || [];
    this.generateMetadataColumns(currentObsSet);
    this.observationSetDS = new MatTableDataSource(currentObsSet);

    // retrieve custom observation/feature sets
    const customSet = this.metadataService.getCustomSets();
    this.customSetDS = new MatTableDataSource(customSet);

    // watch value changes
    this.storageSubscription = this.storage
      .watch(this.workspaceId + '_custom_sets')
      .subscribe(response => {
        this.customSetDS = new MatTableDataSource(
          this.metadataService.getCustomSets()
        );
        this.generateObservationSetsVisualization(); // generate custom observation visualization
        this.cd.markForCheck();
      });
  }

  ngAfterViewInit() {
    this.observationSetDS.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.complete();
    this.storageSubscription.unsubscribe();
  }

  /**
   * Display the list of all files in the workspace
   * when user clicks button 'Create a current annotation'
   */
  onChooseAnnotation() {
    const dialogRef = this.dialog.open(AddAnnotationDialogComponent, {
      data: { workspaceResources: this.workspaceResources }
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter(selectedFileId => selectedFileId !== undefined),
        switchMap(selectedFileId =>
          this.service.getResourceMetadataObservations(selectedFileId)
        ),
        takeUntil(this.onDestroy)
      )
      .subscribe(metadata => {
        if (metadata?.observation_set?.elements) {
          const currentObsSet = metadata.observation_set.elements;

          this.generateMetadataColumns(currentObsSet);
          this.observationSetDS = new MatTableDataSource(currentObsSet);
          this.storage.set(
            this.workspaceId + '_current_observation_set',
            currentObsSet
          );

          this.observationSetDS.paginator = this.paginator;
          this.cd.markForCheck();
        }
      });
  }

  /**
   * Display the list of all available samples from all files in the workspace
   * when user clicks button 'Create a custom observation set'
   */
  onCreateObservationSet() {
    this.globalObservationSets = [];
    this.service
      .getWorkspaceMetadataObservations(this.workspaceId)
      .pipe(
        switchMap(metadata => {
          if (metadata?.observation_set?.elements) {
            this.globalObservationSets = metadata.observation_set.elements;
          }
          const globalObservationSetsDS = new MatTableDataSource(
            this.globalObservationSets
          );

          // the list of columns for pop-up table to select samples for custom observation sets
          const observationSetsDisplayedColumns = ['select', 'id'];
          const observationSetsDisplayedColumnsAttributesOnly = [];

          const obsSetsWithAttr = this.globalObservationSets.filter(
            set => 'attributes' in set
          );
          const attributes = obsSetsWithAttr.length
            ? obsSetsWithAttr[0].attributes
            : {};

          for (const attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
              observationSetsDisplayedColumns.push(attribute);
              observationSetsDisplayedColumnsAttributesOnly.push(attribute);
            }
          }

          const dialogRef = this.dialog.open(AddObservationSetDialogComponent, {
            data: {
              observationSetDS: globalObservationSetsDS,
              observationSetsDisplayedColumns: observationSetsDisplayedColumns,
              observationSetsDisplayedColumnsAttributesOnly: observationSetsDisplayedColumnsAttributesOnly
            }
          });
          return dialogRef.afterClosed();
        }),
        takeUntil(this.onDestroy)
      )
      .subscribe(newObservationSet => {
        if (newObservationSet) {
          this.metadataService.addCustomSet(newObservationSet);
        }
      });
  }

  generateObservationSetsVisualization() {
    const visTable = [];
    const customObservationSets = this.metadataService.getCustomObservationSets();

    this.visObsDisplayedColumns = [
      'id',
      ...customObservationSets.map(customSet => customSet.name)
    ];
    this.visObsDisplayedColumnsSetsOnly = customObservationSets.map(
      customSet => customSet.name
    );

    if (this.visObsDisplayedColumnsSetsOnly.length > 0) {
      this.getGlobalObservationSets().subscribe(data => {
        this.globalObservationSets = data;
        this.globalObservationSets.forEach(sample => {
          const elem = { sampleName: sample.id };
          customObservationSets.forEach(customSet => {
            if (customSet.elements.filter(e => e.id === sample.id).length > 0) {
              elem[customSet.name] = customSet.color;
            } else {
              elem[customSet.name] = 'transparent';
            }
          });

          visTable.push(elem);
        });
        this.visObservationSetDS = new MatTableDataSource(visTable);
        this.cd.markForCheck();
      });
    }
  }

  /**
   * Display the list of all available features from all files in the workspace
   * when user clicks button 'Create a custom feature set'
   */
  onCreateFeatureSet() {
    let globalFeatureSets = [];
    this.service
      .getWorkspaceMetadataFeatures(this.workspaceId)
      .pipe(
        switchMap(metadata => {
          if (metadata?.feature_set?.elements) {
            globalFeatureSets = metadata.feature_set.elements;
          }
          const globalFeatureSetsDS = new MatTableDataSource(globalFeatureSets);

          // the list of columns for pop-up table to select samples for custom feature sets
          const featureSetsDisplayedColumns = ['select', 'id'];
          const featureSetsDisplayedColumnsAttributesOnly = [];

          const featSetsWithAttr = globalFeatureSets.filter(
            set => 'attributes' in set
          );
          const attributes = featSetsWithAttr.length
            ? featSetsWithAttr[0].attributes
            : {};

          for (const attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
              featureSetsDisplayedColumns.push(attribute);
              featureSetsDisplayedColumnsAttributesOnly.push(attribute);
            }
          }

          const dialogRef = this.dialog.open(AddFeatureSetDialogComponent, {
            data: {
              featureSetDS: globalFeatureSetsDS,
              featureSetsDisplayedColumns: featureSetsDisplayedColumns,
              featureSetsDisplayedColumnsAttributesOnly: featureSetsDisplayedColumnsAttributesOnly
            }
          });
          return dialogRef.afterClosed();
        }),
        takeUntil(this.onDestroy)
      )
      .subscribe(newFeatureSet => {
        if (newFeatureSet) {
          this.metadataService.addCustomSet(newFeatureSet);
        }
      });
  }

  onDeleteCustomSet(setId: string) {
    const dialogRef = this.dialog.open(DeleteSetDialogComponent, {
      data: { setId: setId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        this.metadataService.deleteCustomSet(setId);
      }
    });
  }

  onEditCustomSet(set) {
    this.globalObservationSets = [];
    this.service
      .getWorkspaceMetadataObservations(this.workspaceId)
      .pipe(
        switchMap(metadata => {
          if (metadata?.observation_set?.elements) {
            this.globalObservationSets = metadata.observation_set.elements;
          }
          const globalObservationSetsDS = new MatTableDataSource(
            this.globalObservationSets
          );

          // the list of columns for pop-up table to select samples for custom observation sets
          const observationSetsDisplayedColumns = ['select', 'id'];
          const observationSetsDisplayedColumnsAttributesOnly = [];

          const obsSetsWithAttr = this.globalObservationSets.filter(
            set => 'attributes' in set
          );
          const attributes = obsSetsWithAttr.length
            ? obsSetsWithAttr[0].attributes
            : {};

          for (const attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
              observationSetsDisplayedColumns.push(attribute);
              observationSetsDisplayedColumnsAttributesOnly.push(attribute);
            }
          }

          const dialogRef = this.dialog.open(EditFeatureSetDialogComponent, {
            data: {
              name: set.name,
              color: set.color,
              selectedElements: set.elements,
              observationSetDS: globalObservationSetsDS,
              observationSetsDisplayedColumns: observationSetsDisplayedColumns,
              observationSetsDisplayedColumnsAttributesOnly: observationSetsDisplayedColumnsAttributesOnly
            }
          });
          return dialogRef.afterClosed();
        }),
        takeUntil(this.onDestroy)
      )
      .subscribe(updatedObservationSet => {
        if (updatedObservationSet) {
          this.metadataService.updateCustomSet(updatedObservationSet, set.name);
        }
      });
  }

  onViewCustomSet(set) {
    const dialogRef = this.dialog.open(ViewSetDialogComponent, { data: set });
    dialogRef.afterClosed().subscribe();
  }

  /**
   * Make the list of columns for the Mat Table with current annotation
   */
  generateMetadataColumns(currentObsSet) {
    if (currentObsSet && currentObsSet.length) {
      this.metadataObsDisplayedColumns = ['id'];
      this.metadataObsDisplayedColumnsAttributesOnly = [];
      let attributes = {};
      currentObsSet.forEach(
        sample => (attributes = { ...attributes, ...sample.attributes })
      );
      for (const attribute in attributes) {
        if (attributes.hasOwnProperty(attribute)) {
          this.metadataObsDisplayedColumns.push(attribute);
          this.metadataObsDisplayedColumnsAttributesOnly.push(attribute);
        }
      }
    }
  }

  getGlobalObservationSets() {
    let globalObservationSets = [];
    const subject = new Subject<any>();
    this.service
      .getWorkspaceMetadataObservations(this.workspaceId)
      .subscribe(metadata => {
        if (metadata?.observation_set?.elements) {
          globalObservationSets = metadata.observation_set.elements;
        }
        subject.next(globalObservationSets);
      });
    return subject.asObservable();
  }
}
