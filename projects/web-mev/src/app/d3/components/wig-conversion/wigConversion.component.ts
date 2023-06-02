import { Component, ChangeDetectionStrategy, OnChanges, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError } from "rxjs/operators";

@Component({
    selector: 'mev-wig-conversion',
    templateUrl: './wigConversion.component.html',
    styleUrls: ['./wigConversion.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class WigConversionComponent implements OnChanges {
    @Input() outputs;
    private readonly API_URL = environment.apiUrl;
    outputFileName: string;
    inputFileName: string;
    targetFormat: string;

    constructor(private httpClient: HttpClient) { }

    ngOnChanges(): void {
        let outputFileId = this.outputs.output_file;
        let inputFileId = this.outputs.input_file;
        this.targetFormat = this.outputs.target_format;
        this.getData(outputFileId).subscribe(res => this.outputFileName = res["name"]);
        this.getData(inputFileId).subscribe(res => this.inputFileName = res["name"]);
    }

    getData(uuid) {
        let endPoint = `${this.API_URL}/resources/${uuid}`;
        return this.httpClient.get(endPoint)
            .pipe(
                catchError(error => {
                    throw error;
                }))
    }
}
