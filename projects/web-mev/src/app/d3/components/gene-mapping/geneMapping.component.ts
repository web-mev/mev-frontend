import { Component, ChangeDetectionStrategy, OnChanges, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError } from "rxjs/operators";

@Component({
    selector: 'mev-gene-mapping',
    templateUrl: './geneMapping.component.html',
    styleUrls: ['./geneMapping.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class GeneMappingComponent implements OnChanges {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;
    remappedFileName: string;
    mappingFileName: string;

    constructor(private httpClient: HttpClient) { }

    ngOnChanges(): void {
        let remappedFileId = this.outputs.remapped_file;
        let mappingFileId = this.outputs.mapping;
        this.getData(remappedFileId).subscribe(res => this.remappedFileName = res["name"]);
        this.getData(mappingFileId).subscribe(res => this.mappingFileName = res["name"]);
    }

    getData(uuid) {
        let endPoint = `${this.API_URL}/resources/${uuid}`;
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    console.log("Error: ", error);
                    throw error;
                }))
    }
}
