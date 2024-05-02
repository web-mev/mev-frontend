import { AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { FileService } from '@file-manager/services/file-manager.service';
import { map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CompatibleObsSetService {

    constructor(private fileService: FileService) { }

    validate(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            const obs_set_1_ctrl = control.get('base_condition_samples');
            const obs_set_2_ctrl = control.get('experimental_condition_samples');
            const exp_mtx_ctrl = control.get('raw_counts');
            const obs_set_1 = obs_set_1_ctrl.value;
            const obs_set_2 = obs_set_2_ctrl.value;
            const raw_counts = exp_mtx_ctrl.value;
            if (obs_set_1 && obs_set_2 && raw_counts) {
                return this.fileService.getFilePreview(raw_counts).pipe(
                    map(data => {
                        const firstRow = new Set(Object.keys(data[0].values));

                        const v1 = obs_set_1.elements.map(item => {
                            return item.id;
                        });
                        const v2 = obs_set_2.elements.map(item => {
                            return item.id;
                        })
                        const requested_samples = new Set([...v1, ...v2]);
                        let bad_samples = [];
                        for (const v of requested_samples) {
                            if (!firstRow.has(v)) {
                                bad_samples.push(v);
                            }
                        }
                        if (bad_samples.length > 0) {
                            exp_mtx_ctrl.setErrors({badSample: bad_samples});
                            exp_mtx_ctrl.markAsTouched();
                            return { badSample: bad_samples }
                        } else {
                            exp_mtx_ctrl.setErrors(null);
                            exp_mtx_ctrl.markAsTouched();
                            return null
                        }
                    })
                );
            } else {
                exp_mtx_ctrl.setErrors(null);
                obs_set_1_ctrl.setErrors(null);
                obs_set_2_ctrl.setErrors(null);
                return of(null)
            }
        }
    }
}