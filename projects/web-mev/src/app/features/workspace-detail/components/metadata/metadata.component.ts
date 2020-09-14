import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  QueryList,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatAccordion } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';

import { AddAnnotationDialogComponent } from './dialogs/add-annotation-dialog/add-annotation-dialog.component';
import { WorkspaceResource } from '../../models/workspace-resource';
import { WorkspaceDetailService } from '../../services/workspace-detail.service';
import { AddObservationSetDialogComponent } from './dialogs/add-observation-set-dialog/add-observation-set-dialog.component';

@Component({
  selector: 'mev-metadata',
  templateUrl: './metadata.component.html',
  styleUrls: ['./metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataComponent implements OnInit {
  @ViewChild(MatAccordion) accordion: MatAccordion;
  @Input() workspaceResources: WorkspaceResource[];
  workspaceId: string;

  observationSetDS; // use in MatDataTable to display the current annotation
  customSetDS; // use in MatDataTable to display the list of custom observation/feature sets created by user

  metadataObsDisplayedColumns: string[]; // the list of columns for the Current Annotation table
  metadataObsDisplayedColumnsAttributesOnly: string[];

  customSetsDisplayedColumns: string[] = ['name', 'type', 'actions']; // the list of columns for the Custom Sets table

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
    this.customSetDS = new MatTableDataSource(
      JSON.parse(localStorage.getItem(this.workspaceId + '_custom_sets'))
    );
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
      .pipe(takeUntil(this.onDestroy))
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
    const globalObservationSets = [];
    let globalObservationSetsDS;

    this.service
      .getMetadataForResources(this.workspaceResources)
      .pipe(
        switchMap(metadataArr => {
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
          globalObservationSetsDS = new MatTableDataSource(
            globalObservationSets
          );

          // the list of columns for pop-up table to select samples for custom observation sets
          const observationSetsDisplayedColumns = ['select', 'id'];
          const observationSetsDisplayedColumnsAttributesOnly = [];

          const obsSetsWithAttr = globalObservationSets.filter(
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
          this.cd.markForCheck();
        }
      });
  }

  /**
   * Display the list of all available features from all files in the workspace
   * when user clicks button 'Create a custom feature set'
   */
  onCreateFeatureSet() {}

  /**
   * Make the list of columns for the Mat Table with current annotation
   */
  generateMetadataColumns(currentObsSet) {
    if (currentObsSet && currentObsSet.length) {
      this.metadataObsDisplayedColumns = ['id', 'actions'];
      this.metadataObsDisplayedColumnsAttributesOnly = [];
      const attributes = currentObsSet[0].attributes;
      for (const attribute in attributes) {
        if (attributes.hasOwnProperty(attribute)) {
          this.metadataObsDisplayedColumns.splice(-1, 0, attribute);
          this.metadataObsDisplayedColumnsAttributesOnly.push(attribute);
        }
      }
    }
  }
}
