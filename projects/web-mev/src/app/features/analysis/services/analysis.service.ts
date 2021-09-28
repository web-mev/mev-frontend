import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, concatMap, takeWhile } from 'rxjs/operators';
import { Observable, interval } from 'rxjs';
import { File, FileAdapter } from '@app/shared/models/file';
import { Workspace } from '@app/features/workspace-manager/models/workspace';
import { Operation, OperationAdapter } from '../models/operation';

/**
 * Analyses service
 *
 * Used for running operations and getting operation results in user's workspace
 */
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

  /**
   * Get the list of all available workspace operations.
   *
   */
  getOperations(): Observable<Operation[]> {
    return this.httpClient.get(`${this.API_URL}/operations/`).pipe(
      map((operations: Operation[]) => {
        operations = operations.filter(
          operation => operation['workspace_operation'] === true // to exclude Dropbox operations and other operatins not related to workspace analysis
        );
        return operations.map(operation => this.opAdapter.adapt(operation));
      })
    );
  }

  /**
   * Get the list of all available operation categories
   *
   */
  getOperationCategories(): Observable<any> {
    return this.httpClient.get(`${this.API_URL}/operation-categories/`);
  }

  /**
   * Get the properties for a specific operation
   *
   */
  getOperation(id: string): Observable<Operation> {
    return this.httpClient
      .get(`${this.API_URL}/operations/${id}/`)
      .pipe(
        map((operationData: Operation) => this.opAdapter.adapt(operationData))
      );
  }

  /**
   * Run an operation
   *
   */
  executeOperation(operationId, workspaceId, inputs): Observable<any> {
    const body = {
      operation_id: operationId,
      workspace_id: workspaceId,
      job_name: inputs.job_name,
      inputs: inputs
    };

    return this.httpClient.post(`${this.API_URL}/operations/run/`, body);
  }

  /**
   * Get operation results
   * Send http-request every x seconds (see below) if the previous request returns and the status is 202, 204 or 208
   */
  getExecutedOperationResult(executedOperationId: string): Observable<any> {
    // check the status of the operation execution until the job is fully completed (i.e. status = 200)
    const codesInProcess = [204, 202, 208]; // 204 - job is still running; 202 - job has completed and acknowledges that the 'finalization' steps have started; 208 - job has completed and the finalization has started, but has not completed
    return interval(3000).pipe(
      // originally this was using switchMap. However, the backend very rarely raised problems due to race conditions
      // In principle, concatMap should wait for each response to complete so we don't end up with this issue.
      concatMap(() =>
        this.httpClient.get(
          `${this.API_URL}/executed-operations/${executedOperationId}/`,
          { observe: 'response' }
        )
      ),
      takeWhile(response => codesInProcess.includes(response.status), true)
    );
  }

  /**
   * Get the content of a workspace resource by resource id
   */
  getResourceContent(
    resourceId: string,
    pageIndex = 0,
    pageSize = 0,
    filters = {},
    sorting = {}
  ): Observable<any> {
    let params = new HttpParams();

    if (pageIndex) {
      params = params.append('page', pageIndex.toString());
    }

    if (pageSize) {
      params = params.append('page_size', pageSize.toString());
    }

    for (const field in filters) {
      if (filters.hasOwnProperty(field)) {
        // TSLint rule
        const expression = filters[field];
        params = params.append(field, expression.toString());
      }
    }

    if (sorting.hasOwnProperty('sortField')) {
      const sortDirection = sorting['sortDirection'] || 'asc';
      params = params.append(
        'sort_vals',
        '[' + sortDirection + ']:' + sorting['sortField']
      ); // query param for sorting should have the format: ?sort_vals=[asc]:pvalue,[desc]:log2FoldChange
    }

    return this.httpClient.get(
      `${this.API_URL}/resources/${resourceId}/contents/`,
      { params: params }
    );
  }

  /**
   * Get the list of executed operations for a user, regardless of whether they
   * are workspace operations or not
   */
   getAllNonWorkspaceExecOperations(): Observable<any> {
    return this.httpClient.get(
      `${this.API_URL}/non-workspace-executed-operations/`
    );
  }

  /**
   * Get the list of executed operations of a workspace
   */
  getExecOperations(workspaceId: string): Observable<any> {
    return this.httpClient.get(
      `${this.API_URL}/executed-operations/workspace/${workspaceId}/`
    );
  }

  /**
   * Get the list of executed operations of a workspace in the tree format
   */
  getExecOperationDAG(workspaceId: string): Observable<any> {
    return this.httpClient.get(
      `${this.API_URL}/executed-operations/workspace/${workspaceId}/tree/`
    );
  }

  /**
   * Save the executed operations of a workspace for a user. Creates a new file for them
   */
  exportExecOperationDAG(workspaceId: string): Observable<any> {
    return this.httpClient.get(
      `${this.API_URL}/executed-operations/workspace/${workspaceId}/tree/save`,
      { observe: 'response' }
    );
  }

  /**
   * Get the properies of a workspace
   */
  getWorkspaceDetail(id: number | string): Observable<Workspace> {
    return <Observable<Workspace>>(
      this.httpClient.get(`${this.API_URL}/workspaces/${id}/`)
    );
  }

  /**
   * Get the resources/files of a workspace that can be used for analyses
   */
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
              item.workspaces.some(workspace => workspace.id === workspaceId)
          )
        ),
        map((data: any[]) => data.map(item => this.fileAdapter.adapt(item)))
      )
    );
  }
}
