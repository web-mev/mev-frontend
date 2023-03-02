import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '@environments/environment';


/**
 * File service
 *
 * Used for operations with file in the File Manager
 */
@Injectable({
    providedIn: 'root'
})
export class GlobusService {

    private readonly API_URL = environment.apiUrl;

    constructor(
        private httpClient: HttpClient,
    ) { }

    /**
     * Gets the url to the Globus auth page
     * provided by the backend
     */
    initGlobusAuth(direction: string): Observable<any> {
        return this.httpClient.get(`${this.API_URL}/globus/initiate/?direction=${direction}`);
    }

    sendGlobusCode(code: string, direction: string): Observable<any> {
        return this.httpClient.get(
            `${this.API_URL}/globus/initiate/?code=${code}&direction=${direction}`
        );
    }

    startGlobusUpload(data: object): Observable<any> {
        return this.httpClient.post(
            `${this.API_URL}/globus/transfer/upload/`,
            data
        );
    }

    startGlobusDownload(data: object): Observable<any> {
        return this.httpClient.post(
            `${this.API_URL}/globus/transfer/download/`,
            data
        );
    }

}