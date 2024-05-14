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

    validate_for_dge(): AsyncValidatorFn {
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
                            exp_mtx_ctrl.setErrors({ badSample: bad_samples });
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

    validate_for_single_obs_set(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {

            const obs_set_ctrl = control.get('samples');
            const mtx_ctrl = control.get('input_matrix');
            const num_clusters_ctrl = control.get('num_clusters')
            const obs_set = obs_set_ctrl.value;
            const mtx = mtx_ctrl.value;
            const num_clusters = num_clusters_ctrl.value;
            if (mtx && num_clusters) {
                return this.fileService.getFilePreview(mtx).pipe(
                    map(data => {
                        const firstRow = Object.keys(data[0].values);

                        let requested_samples
                        if (obs_set) {
                            requested_samples = obs_set.elements.map(item => {
                                return item.id;
                            });
                        } else {
                            requested_samples = firstRow;
                        }

                        // if the number of clusters is greater than either
                        // the number of samples in the matrix or the requested
                        // number of samples, then clustering doesn't make sense
                        if ((num_clusters >= firstRow.length) || (num_clusters >= requested_samples.length)) {
                            num_clusters_ctrl.setErrors({ bad_cluster_num: true });
                            return { bad_cluster_num: true }
                        } else {
                            num_clusters_ctrl.setErrors(null);
                        }

                        let bad_samples = [];
                        for (const v of requested_samples) {
                            if (!firstRow.includes(v)) {
                                bad_samples.push(v);
                            }
                        }
                        if (bad_samples.length > 0) {
                            mtx_ctrl.setErrors({ badSample: bad_samples });
                            mtx_ctrl.markAsTouched();
                            return { badSample: bad_samples }
                        } else {
                            mtx_ctrl.setErrors(null);
                            mtx_ctrl.markAsTouched();
                            return null
                        }
                    })
                );
            }
            else {
                mtx_ctrl.setErrors(null);
                obs_set_ctrl.setErrors(null);
                num_clusters_ctrl.setErrors(null);
                return of(null)
            }
        }
    }

    validate_for_sctk_mast(type): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (type === 'direct_comparison') {
                const obs_set_1_ctrl = control.get('baseSamples');
                const obs_set_2_ctrl = control.get('expSamples');
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
                                exp_mtx_ctrl.setErrors({ badSample: bad_samples });
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
            } else {
                const obs_set_2_ctrl = control.get('expSamples');
                const exp_mtx_ctrl = control.get('raw_counts');
                const obs_set_2 = obs_set_2_ctrl.value;
                const raw_counts = exp_mtx_ctrl.value;
                if (obs_set_2 && raw_counts) {
                    return this.fileService.getFilePreview(raw_counts).pipe(
                        map(data => {
                            const firstRow = new Set(Object.keys(data[0].values));
                            const v2 = obs_set_2.elements.map(item => {
                                return item.id;
                            })
                            const requested_samples = new Set([...v2]);
                            let bad_samples = [];
                            for (const v of requested_samples) {
                                if (!firstRow.has(v)) {
                                    bad_samples.push(v);
                                }
                            }
                            if (bad_samples.length > 0) {
                                exp_mtx_ctrl.setErrors({ badSample: bad_samples });
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
                    obs_set_2_ctrl.setErrors(null);
                    return of(null)
                }
            }

        }
    }

//     validate_for_sctk_mast2(): AsyncValidatorFn {
//         console.log("#2 called")
//         return (control: AbstractControl): Observable<ValidationErrors | null> => {
//             // const obs_set_1_ctrl = control.get('baseSamples');
//             const obs_set_2_ctrl = control.get('expSamples');
//             const exp_mtx_ctrl = control.get('raw_counts');
//             // const obs_set_1 = obs_set_1_ctrl.value;
//             const obs_set_2 = obs_set_2_ctrl.value;
//             const raw_counts = exp_mtx_ctrl.value;
//             if (obs_set_2 && raw_counts) {
//                 return this.fileService.getFilePreview(raw_counts).pipe(
//                     map(data => {
//                         const firstRow = new Set(Object.keys(data[0].values));

//                         // const v1 = obs_set_1.elements.map(item => {
//                         //     return item.id;
//                         // });
//                         const v2 = obs_set_2.elements.map(item => {
//                             return item.id;
//                         })
//                         const requested_samples = new Set([...v2]);
//                         let bad_samples = [];
//                         for (const v of requested_samples) {
//                             if (!firstRow.has(v)) {
//                                 bad_samples.push(v);
//                             }
//                         }
//                         if (bad_samples.length > 0) {
//                             exp_mtx_ctrl.setErrors({ badSample: bad_samples });
//                             exp_mtx_ctrl.markAsTouched();
//                             return { badSample: bad_samples }
//                         } else {
//                             exp_mtx_ctrl.setErrors(null);
//                             exp_mtx_ctrl.markAsTouched();
//                             return null
//                         }
//                     })
//                 );
//             } else {
//                 exp_mtx_ctrl.setErrors(null);
//                 // obs_set_1_ctrl.setErrors(null);
//                 obs_set_2_ctrl.setErrors(null);
//                 return of(null)
//             }
//         }
//     }

}




