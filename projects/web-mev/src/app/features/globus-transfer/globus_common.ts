import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { LclStorageService } from "@app/core/local-storage/lcl-storage.service";
import { GlobusService } from "./services/globus";

export function handleBackendAuthResponse(response: any, storage: LclStorageService){
    let url = '';
    // if the user has not previously authenticated
    // with Globus (and the backend does not have Globus
    // tokens), then the backend will return a url to the
    // Globus authentication page
    if ('globus-auth-url' in response) {

        // part of the OAuth2 spec includes a 'state'
        // parameter, which is part of the url params
        // returned by the backend. We cache this in
        // local browser storage so that we can later
        // compare it with the response from the Globus
        // auth server
        url = response['globus-auth-url'];
        let params = url.split("?")[1].split("&");
        let paramObj = {};
        for (let p of params) {
            let kvp_array = p.split("=");
            paramObj[kvp_array[0]] = kvp_array[1];
        }
        storage.set('globus-state', paramObj['state']);
        storage.set('globus-direction', 'upload');
    } else if ('globus-browser-url' in response) {
        // if the user has Globus tokens on the backend, the backend
        // will return a link to the Globus file browser
        url = response['globus-browser-url'];
    } else {
        return '';
    }
    return url;
}

export function authInit(
    globusService: GlobusService,
    storage: LclStorageService,
    direction: string): Observable<string> {

    return globusService.initGlobusAuth(direction).pipe(
        map(
            x => handleBackendAuthResponse(x, storage)
        ),
        catchError(err => of(''))
    );
}