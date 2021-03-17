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
import { takeUntil, switchMap, delay } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatAccordion } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';

import { AddAnnotationDialogComponent } from './dialogs/add-annotation-dialog/add-annotation-dialog.component';
import { WorkspaceResource } from '../../models/workspace-resource';
import { WorkspaceDetailService } from '../../services/workspace-detail.service';
import { AddObservationSetDialogComponent } from './dialogs/add-observation-set-dialog/add-observation-set-dialog.component';
import { DeleteSetDialogComponent } from './dialogs/delete-set-dialog/delete-set-dialog.component';
import { ViewSetDialogComponent } from './dialogs/view-set-dialog/view-set-dialog.component';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { MetadataService } from '@app/core/metadata/metadata.service';
import { EditFeatureSetDialogComponent } from './dialogs/edit-feature-set-dialog/edit-feature-set-dialog.component';
import { ViewInfoDialogComponent } from './dialogs/view-info-dialog/view-info-dialog.component';
import { CustomSet, CustomSetType } from '@app/_models/metadata';
import { NotificationService } from '@app/core/core.module';
import { AddCustomSetComponent } from '@app/shared/components/add-custom-set/add-custom-set.component';
import { SetDifferenceDialogComponent } from './dialogs/set-difference-dialog/set-difference-dialog.component';
/**
 * Metadata Component
 *
 * Used to add, edit, remove custom observations sets and edit, remove custom feature sets.
 * User's custom sets are stored in local storage only
 */
@Component({
  selector: 'mev-metadata',
  templateUrl: './metadata.component.html',
  styleUrls: ['./metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MetadataComponent implements OnInit {
  displayedColumns = ['name', 'symbol'];
  displayedColumnsAttributesOnly = [];

  @ViewChild(MatAccordion) accordion: MatAccordion;
  @Input() workspaceResources: WorkspaceResource[];
  workspaceId: string;

  //observationSetDS; // use in MatDataTable to display the current annotation
  metadataObsDisplayedColumns: string[]; // columns for the Current Annotation table
  metadataObsDisplayedColumnsAttributesOnly: string[];

  customSetDS; // use in MatDataTable to display the list of custom observation/feature sets created by user
  customSetsDisplayedColumns: string[] = ['select', 'name', 'type', 'size', 'actions']; // the list of columns for the Custom Sets table

  visObservationSetDS; // use in MatDataTable to display visualisation for custom observation sets
  visObsDisplayedColumns: string[];
  visObsDisplayedColumnsSetsOnly: string[];

  globalObservationSets = []; // all samples from all resources

  datasource;
  selection = new SelectionModel<CustomSet>(true, []);
  isWait = false;
  private readonly onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  storageSubscription: Subscription;

  constructor(
    private service: WorkspaceDetailService,
    private metadataService: MetadataService,
    private storage: LclStorageService,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    public dialog: MatDialog,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('workspaceId');

    // check if there is a current annotation saved locally to display
    // const currentObsSet =
    //   JSON.parse(
    //     localStorage.getItem(this.workspaceId + '_current_observation_set')
    //   ) || [];
    //this.generateMetadataColumns(currentObsSet);
    //this.observationSetDS = new MatTableDataSource(currentObsSet);

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
        console.log('in the callback for the storage subscription');
        this.selection.clear();
      });
  }

  ngAfterViewInit() {
    //this.observationSetDS.paginator = this.paginator;
    this.customSetDS.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.complete();
    this.storageSubscription.unsubscribe();
  }

  /**
   * Method is triggered when the user clicks button 'Incorporate annotation'
   *
   */
  onChooseAnnotation() {
    const dialogRef = this.dialog.open(AddAnnotationDialogComponent, {
      data: { workspaceResources: this.workspaceResources }
    });
    dialogRef.afterClosed().subscribe(newCustomSets => {
      if (newCustomSets) {
        newCustomSets.forEach(newCustomSet =>
          this.metadataService.addCustomSet(newCustomSet)
        );
      }
    });
  }

  /**
   * Method is triggered when the user clicks button 'Create a custom observation set'
   * Display the list of all available samples from all files in the workspace
   */
  onCreateObservationSet() {
    this.isWait = true;
    this.globalObservationSets = [];
    this.service
      .getWorkspaceMetadataObservations(this.workspaceId)
      .pipe(
        delay(500), // delay for spinner
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

          this.isWait = false;
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

  /**
   * Method to display the list of custom observation sets in the Visualization mode
   */
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
   * Method is triggered when the user clicks icon 'Delete'
   * Delete a custom observation or feature set from the list
   */
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

  /**
   * Method is triggered when the user clicks icon 'Edit'
   *
   * Edit a custom observation or feature set.
   * For custom observation sets the user can update name, color, list of samples.
   * For feature sets only names can be updated
   */
  onEditCustomSet(set) {
    this.isWait = true;
    this.globalObservationSets = [];
    this.service
      .getWorkspaceMetadataObservations(this.workspaceId)
      .pipe(
        delay(500), // delay for spinner
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

          this.isWait = false;
          const dialogRef = this.dialog.open(EditFeatureSetDialogComponent, {
            data: {
              name: set.name,
              color: set.color,
              type: set.type,
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

  /**
   * Method is triggered when the user clicks icon 'View'
   * View a custom observation or feature set.
   */

  onViewCustomSet(set) {
    const dialogRef = this.dialog.open(ViewSetDialogComponent, { data: set });
    dialogRef.afterClosed().subscribe();
  }

  /**
   * Make the list of columns for the Mat Table with current annotation
   */
  // generateMetadataColumns(currentObsSet) {
  //   if (currentObsSet && currentObsSet.length) {
  //     this.metadataObsDisplayedColumns = ['id'];
  //     this.metadataObsDisplayedColumnsAttributesOnly = [];
  //     let attributes = {};
  //     currentObsSet.forEach(
  //       sample => (attributes = { ...attributes, ...sample.attributes })
  //     );
  //     for (const attribute in attributes) {
  //       if (attributes.hasOwnProperty(attribute)) {
  //         this.metadataObsDisplayedColumns.push(attribute);
  //         this.metadataObsDisplayedColumnsAttributesOnly.push(attribute);
  //       }
  //     }
  //   }
  // }

  /**
   * Get the list of observations used in all files/resources included in the current workspace
   */
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

  /**
   * Method is triggered when the user clicks a link in the Metadata tab description
   */
  viewCustomSetInfo() {
    this.dialog.open(ViewInfoDialogComponent);
  }


  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.customSetDS.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(ev) {
    if(ev){
      this.isAllSelected() ?
          this.selection.clear() :
          this.customSetDS.data.forEach(row => this.selection.select(row));
          console.log('selected(master): ', this.selection.selected);
    } else {
      return null;
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: CustomSet): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} ${row.name}`;
  }

  rowClicked(ev, row: CustomSet) {
    if(ev){
      this.selection.toggle(row);
    } else {
      return null;
    }
  }

  prepForSetOperations(){
    let setNames = [];
    const setTypes = new Set(this.selection.selected.map( s => s['type']));
    if(setTypes.size > 1) {
      const msg = 'You can only intersect sets of the same type.';
      this.notificationService.warn(msg)
      return;
    } else {
      let setsArr = [];
      for(const s of this.selection.selected) {
        const obj = {
          multiple: s['multiple'],
          elements: s['elements']
        }
        setsArr.push(obj)
        setNames.push(s['name']);
      }
      const setType = [...setTypes][0]; // converts the set into a list- it's a single item if we are here anyway
      const t = setType === CustomSetType.FeatureSet ? 'feature' : 'observation';
      const payload = {
        sets: setsArr,
        set_type: t,
        ignore_attributes: true // for these operations, we don't care about merging the attributes
      }
      return {
        payload: payload,
        setType: setType,
        setNames: setNames
      }
    }
  }

  makeSetIntersection() {
    const setData = this.prepForSetOperations();
    if(setData) {
      const setType = setData.setType
      const payload = setData.payload;
      this.metadataService.intersectCustomSets(payload).subscribe(
        newSet => {
          if(newSet.elements.length === 0){
            this.notificationService.warn('The intersection was empty. No set was created.');
            return;
          }
          // open the dialog to name the new set and set its color
          const dialogRef = this.dialog.open(AddCustomSetComponent, {
              data : {
                type: setType
              }  
            }
          );
          dialogRef.afterClosed().subscribe(customSetData => {
            if (customSetData) {
              const customSet: CustomSet = {
                name: customSetData.name,
                type: setType,
                color: customSetData.color,
                elements: newSet.elements,
                multiple: newSet.multiple
              };
              this.metadataService.addCustomSet(customSet);
            }
          });
        }
      );
    }
  }


  makeSetUnion() {
    const setData = this.prepForSetOperations();
    if(setData) {
      const setType = setData.setType
      const payload = setData.payload;
      this.metadataService.unionCustomSets(payload).subscribe(
        newSet => {
          if(newSet.elements.length === 0){
            // Shouldn't get here since union is only empty if merging empty sets, but guard anyway
            this.notificationService.warn('The union was empty. No set was created.');
            return;
          }
          // open the dialog to name the new set and set its color
          const dialogRef = this.dialog.open(AddCustomSetComponent, {
              data : {
                type: setType
              }  
            }
          );
          dialogRef.afterClosed().subscribe(customSetData => {
            if (customSetData) {
              const customSet: CustomSet = {
                name: customSetData.name,
                type: setType,
                color: customSetData.color,
                elements: newSet.elements,
                multiple: newSet.multiple
              };
              this.metadataService.addCustomSet(customSet);
            }
          });
        }
      );
    }
  }

  makeSetDifference(){   
    const setData = this.prepForSetOperations();
    if(setData) {
      const setType = setData.setType
      const tmpPayload = setData.payload;
      const setNames = setData.setNames;

      const firstSet = tmpPayload['sets'][0];
      const secondSet = tmpPayload['sets'][1];
      const firstName = setNames[0];
      const secondName = setNames[1];

      const dialogRef = this.dialog.open(SetDifferenceDialogComponent, {
        data: {
          setA: firstSet,
          setB: secondSet,
          setAName: firstName,
          setBName: secondName
        }
      });
      dialogRef.afterClosed().subscribe(
        data => {
          // Note that the dialog passing this information
          // hasn't done anything yet. Instead, the dialog
          // was used to collect the info that will now be 
          // handled on the server side. After that (if successful)
          // we will add it to the client side sets.
          console.log('new set:', data);
          if (data) {
            let payload = tmpPayload;
            payload['sets'] = data['ordering'];
            this.metadataService.differenceCustomSets(payload).subscribe( customSetData => { 
              if (customSetData.elements.length === 0){
                this.notificationService.warn('The difference set was empty. As a result, no new set has been created.')
              } else {     
                const customSet: CustomSet = {
                  name: data.name,
                  type: setType,
                  color: data.color,
                  elements: customSetData.elements,
                  multiple: customSetData.multiple
                };
                this.metadataService.addCustomSet(customSet);
              }
            });
          }
        }
      );
    }
  }

}
