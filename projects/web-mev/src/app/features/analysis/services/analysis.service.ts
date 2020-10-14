import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { map, switchMap, takeUntil, takeWhile } from 'rxjs/operators';
import { Observable, interval, timer, pipe, of } from 'rxjs';
import { File, FileAdapter } from '@app/shared/models/file';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Operation, OperationAdapter } from '../models/operation';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AnalysesService {
  private readonly API_URL = environment.apiUrl;
  pca_explained_variances = [];

  constructor(
    private httpClient: HttpClient,
    private opAdapter: OperationAdapter,
    private fileAdapter: FileAdapter,
    private storage: LclStorageService
  ) {}

  getWorkspaceDetail(id: number | string): Observable<Workspace> {
    return <Observable<Workspace>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${id}/`)
    );
  }

  getAvailableResourcesByParam(
    types: string[],
    workspaceId: string
  ): Observable<File[]> {
    return <Observable<File[]>>(
      this.httpClient.get<File[]>(`${this.API_URL}/resources/`).pipe(
        map(data =>
          data.filter(
            item =>
              types.includes(item.resource_type) &&
              item.workspace === workspaceId
          )
        ),
        map((data: any[]) => data.map(item => this.fileAdapter.adapt(item)))
      )
    );
  }

  getAvailableObservationSetsByParam(workspaceId: string): any[] {
    const custom_sets = this.storage.get(workspaceId + '_custom_sets') || [];
    return custom_sets.filter(set => set.type === 'Observation set');
  }

  getOperations(): Observable<Operation[]> {
    return this.httpClient
      .get(`${this.API_URL}/operations/`)
      .pipe(
        map((operations: Operation[]) =>
          operations.map(operation => this.opAdapter.adapt(operation))
        )
      );
  }

  getOperation(id: string): Observable<Operation> {
    return this.httpClient
      .get(`${this.API_URL}/operations/${id}/`)
      .pipe(
        map((operationData: Operation) => this.opAdapter.adapt(operationData))
      );
  }

  executeOperation(operationId, workspaceId, inputs): Observable<any> {
    const body = {
      operation_id: operationId,
      workspace_id: workspaceId,
      inputs: inputs
    };

    return this.httpClient.post(`${this.API_URL}/operations/run/`, body);
  }

  getExecutedOperationResult(executedOperationId: string): Observable<any> {
    // check the status of the operation execution until the job is fully completed (i.e. status = 200)
    const codesInProcess = [204, 202, 208]; // 204 - job is still running; 202 - job has completed and acknowledges that the 'finalization' steps have started; 208 - job has completed and the finalization has started, but has not completed
    return interval(2000).pipe(
      switchMap(() =>
        this.httpClient.get(
          `${this.API_URL}/executed-operations/${executedOperationId}/`,
          { observe: 'response' }
        )
      ),
      takeWhile(response => codesInProcess.includes(response.status), true)
    );
  }

  getResourceContent(resourceId: string): Observable<any> {
    return this.httpClient.get(
      `${this.API_URL}/resources/${resourceId}/contents/`
    );
  }

  getPCACoordinates(executedOperationId: string): Observable<any> {
    return this.getExecutedOperationResult(executedOperationId).pipe(
      switchMap(response => {
        if (
          response.body &&
          response.body.outputs &&
          response.body.outputs.pca_coordinates
        ) {
          const resourceId = response.body.outputs.pca_coordinates;
          let i = 1;
          while (
            response.body.outputs.hasOwnProperty(
              'pc' + i + '_explained_variance'
            )
          ) {
            const item = {
              name: 'pc' + i,
              var: response.body.outputs['pc' + i + '_explained_variance']
            };
            this.pca_explained_variances.push(item);
            i++;
          }

          return this.getResourceContent(resourceId);
        }
        return of();
      }),
      map(response => ({
        ...response,
        pca_explained_variances: this.pca_explained_variances
      }))
    );
  }
}
