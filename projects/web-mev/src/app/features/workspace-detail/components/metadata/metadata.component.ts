import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';
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

  constructor(
    private service: WorkspaceDetailService,
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
    const customSet =
      JSON.parse(localStorage.getItem(this.workspaceId + '_custom_sets')) || [];
    this.customSetDS = new MatTableDataSource(customSet);

    // generate custom observation visualization
    this.generateObservationSetsVisualization();
  }

  ngAfterViewInit() {
    this.observationSetDS.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.complete();
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
        switchMap(selectedFileId => this.service.getMetadata(selectedFileId)),
        takeUntil(this.onDestroy)
      )
      .subscribe(metadata => {
        if (metadata) {
          if (metadata.observation_set && metadata.observation_set.elements) {
            const currentObsSet = metadata.observation_set.elements;
            this.generateMetadataColumns(currentObsSet);
            this.observationSetDS = new MatTableDataSource(currentObsSet);
            localStorage.setItem(
              this.workspaceId + '_current_observation_set',
              JSON.stringify(currentObsSet)
            );
          }

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
      .getMetadataForResources(this.workspaceResources)
      .pipe(
        switchMap(metadataArr => {
          metadataArr.forEach(metadata => {
            const elements = metadata.observation_set.elements;
            // add only samples that don't exist
            elements.forEach(element => {
              const index = this.globalObservationSets.findIndex(
                el => el.id === element.id
              );
              if (index === -1) {
                this.globalObservationSets.push(element);
              }
            });
          });

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
          const customObservationSets =
            JSON.parse(
              localStorage.getItem(this.workspaceId + '_custom_sets')
            ) || [];
          customObservationSets.push(newObservationSet);
          localStorage.setItem(
            this.workspaceId + '_custom_sets',
            JSON.stringify(customObservationSets)
          );
          this.customSetDS = new MatTableDataSource(
            JSON.parse(localStorage.getItem(this.workspaceId + '_custom_sets'))
          );
          this.generateObservationSetsVisualization();
          this.cd.markForCheck();
        }
      });
  }

  generateObservationSetsVisualization() {
    const visTable = [];
    const customObservationSets =
      JSON.parse(localStorage.getItem(this.workspaceId + '_custom_sets')) || [];
    this.visObsDisplayedColumns = ['id'];
    this.visObsDisplayedColumnsSetsOnly = [];

    customObservationSets.forEach(customSet => {
      if (customSet.type.toUpperCase().indexOf('OBSERVATION') >= 0) {
        this.visObsDisplayedColumns.push(customSet.name);
        this.visObsDisplayedColumnsSetsOnly.push(customSet.name);
      }
    });

    if (this.visObsDisplayedColumnsSetsOnly.length > 0) {
      this.getGlobalObservationSets().subscribe(data => {
        this.globalObservationSets = data;
        this.globalObservationSets.forEach(sample => {
          const elem = { sampleName: sample.id };
          customObservationSets.forEach(customSet => {
            if (customSet.type.toUpperCase().indexOf('OBSERVATION') >= 0) {
              if (
                customSet.samples.filter(e => e.id === sample.id).length > 0
              ) {
                elem[customSet.name] = true;
              } else {
                elem[customSet.name] = false;
              }
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
    const globalFeatureSets = [];

    this.service
      .getMetadataForResources(this.workspaceResources)
      .pipe(
        switchMap(metadataArr => {
          metadataArr.forEach(metadata => {
            const elements = metadata.feature_set
              ? metadata.feature_set.elements
              : [];
            // add only samples that don't exist
            elements.forEach(element => {
              const index = globalFeatureSets.findIndex(
                el => el.id === element.id
              );
              if (index === -1) {
                globalFeatureSets.push(element);
              }
            });
          });

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
          const customFeatureSets =
            JSON.parse(
              localStorage.getItem(this.workspaceId + '_custom_sets')
            ) || [];
          customFeatureSets.push(newFeatureSet);
          localStorage.setItem(
            this.workspaceId + '_custom_sets',
            JSON.stringify(customFeatureSets)
          );
          this.customSetDS = new MatTableDataSource(
            JSON.parse(localStorage.getItem(this.workspaceId + '_custom_sets'))
          );
          this.cd.markForCheck();
        }
      });
  }

  onDeleteCustomSet(setId: string) {
    const dialogRef = this.dialog.open(DeleteSetDialogComponent, {
      data: { setId: setId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 1) {
        const customObservationSets =
          JSON.parse(localStorage.getItem(this.workspaceId + '_custom_sets')) ||
          [];
        const foundIndex = customObservationSets.findIndex(
          set => set.name === setId
        );

        customObservationSets.splice(foundIndex, 1);
        localStorage.setItem(
          this.workspaceId + '_custom_sets',
          JSON.stringify(customObservationSets)
        );
        this.customSetDS = new MatTableDataSource(
          JSON.parse(localStorage.getItem(this.workspaceId + '_custom_sets'))
        );
        this.cd.markForCheck();
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
    const globalObservationSets = [];
    const subject = new Subject<any>();
    this.service
      .getMetadataForResources(this.workspaceResources)
      .subscribe(metadataArr => {
        metadataArr.forEach(metadata => {
          const elements = metadata.observation_set.elements;
          // add only samples that don't exist
          elements.forEach(element => {
            const index = globalObservationSets.findIndex(
              el => el.id === element.id
            );
            if (index === -1) {
              globalObservationSets.push(element);
            }
          });
        });
        subject.next(globalObservationSets);
      });
    return subject.asObservable();
  }
}
