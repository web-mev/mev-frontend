import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpBackend } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Used for querying the solr server exposed by Amigo (ontology DB)
 * 
 * Note that this service gets around the usual HttpInterceptor (which
 * adds our JWT for the webmev api in the header) and makes a "direct"
 * request.
 */
@Injectable({
  providedIn: 'root'
})
export class AmigoService {

  baseUrl = 'http://golr-aux.geneontology.io/solr/select';

  private httpClient: HttpClient

  /**
   * In the constructor we instantiate the new HttpClient which bypasses
   * our interceptor (hence, not adding the auth headers needed to authenticate
   * requests to the webmev api)
   */
  constructor(
    handler: HttpBackend
  ) {
      this.httpClient = new HttpClient(handler);
  }

  get_amigo_genes(goId: string, organism: string): Observable<any> {
    let orgMapping = {
        'Human': 'Homo sapiens',
        'Mouse': 'Mus musculus'
    }
    let orgString = orgMapping[organism];
    let params = new HttpParams();
    params = params.append('q', '*:*');
    params = params.append('start', '0');
    params = params.append('rows', '100000');
    params = params.append('wt', 'json');
    params = params.append('fl', 'bioentity_label');
    params = params.append('fq', 'document_category:"bioentity"');
    params = params.append('fq', `taxon_subset_closure_label:"${orgString}"`);
    params = params.append('fq', 'regulates_closure:"' + goId + '"');
    return this.httpClient.get(
        this.baseUrl,
        {params: params}
    );

  }

}