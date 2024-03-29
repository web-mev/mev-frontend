import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/**
 * Modal dialog component which is used when the user wishes to create
 * a public dataset. They can choose to provide a custom name or skip,
 * which will cause the backend to autoname their new file(s)
 */
@Component({
    selector: 'confirm-public-dataset-export-name-dialog',
    templateUrl: './export-name-dialog.component.html',
    styleUrls: ['./export-name-dialog.component.scss']
})
export class PublicDatasetExportNameDialogComponent implements OnInit {

    errorMsg = 'Please use a name that starts with a letter and contains \
        only letters, numbers, dashes, or underscores. It also must end \
        with a letter or number';
    invalidName = false;
    exportNameFormControl: FormControl;
    isUseCaseIDChecked: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<PublicDatasetExportNameDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit() {
        // the regex below requires that we start with a letter,
        // allow letters, numbers, dashes, and underscores
        // and ends with a letter/number.
        this.exportNameFormControl = new FormControl(
            '',
            Validators.pattern('[a-zA-Z][-\\w]*[\\w]')
        );

        // this is setup so that errors (via the <mat-error> tag)
        // are immediately displayed. Otherwise, the user has to 
        // unfocus the <input> before the error text is displayed.
        this.exportNameFormControl.valueChanges.subscribe((x) => {
            this.exportNameFormControl.markAsTouched();
        }
        );
    }

    /**
     * Returning an empty string will trigger auto-naming
     * of the dataset export on the backend
     */
    useAutoname(): void {
        let formData = {
            "output_name": '',
            "isUseCaseIDChecked": this.isUseCaseIDChecked
        }
        this.dialogRef.close(formData);
    }

    /**
     * The user has supplied a valid name- go create the dataset
     * with that name
     */
    confirmExportName(): void {
        let formData = {
            "output_name": this.exportNameFormControl.value,
            "isUseCaseIDChecked": this.isUseCaseIDChecked
        }
        this.dialogRef.close(formData);
    }

    /**
     * This is used to cancel the action, so they back out without 
     * actually creating a dataset. The returned 'null' is a signal of that
     * 
     */
    cancel(): void {
        this.dialogRef.close(null);
    }
}
