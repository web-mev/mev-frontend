import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { File, FileAdapter } from '@app/shared/models/file';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Operation, OperationAdapter } from '../models/operation';

@Injectable({
  providedIn: 'root'
})
export class AnalysesService {
  private readonly API_URL = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
    private opAdapter: OperationAdapter,
    private fileAdapter: FileAdapter
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
    const custom_sets = JSON.parse(
      localStorage.getItem(workspaceId + '_custom_sets')
    );
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

  getOperation(id: number | string): Observable<Operation> {
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

    // TO DO: re-format input if it is ObservationSet

    // for (let prop in inputs) {
    //   if ('isObservationSet' in inputs[prop]) {
    //     // reformat the ObservationSet input if necessary
    //   }
    // }
    return this.httpClient.post(`${this.API_URL}/operations/run/`, body);
  }
}
