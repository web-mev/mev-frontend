import { 
    Directive, 
    OnDestroy,
    ElementRef,
    Input,
    HostListener,
    Host
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, map, tap } from 'rxjs/operators';

import { FileService } from '../services/file-manager.service';

@Directive({
    selector: '[fileDownload]',
    exportAs: 'fileDownload',
})
export class FileDownloadDirective implements OnDestroy {

    @Input() resourceId: string;
    //@Input() filename: string;
    private destroy$: Subject<void> = new Subject<void>();

    constructor(private ref: ElementRef, private fileService: FileService) {}

    @HostListener('click')
    onClick(): void {
        this.fileService.fetchDownloadUrl(this.resourceId)
            .subscribe(x => {
                let u = x['url'];
                let download_type = x['download_type'];

                // if the server responds that the download_type is "local",
                // then we are downloading directly from the api server.
                if (download_type === 'local'){
                    this.initiateDownload();
                } else {                
                    const link = document.createElement('a')
                    link.setAttribute('href', u);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
    }

    // starts the process of a direct download from the api server
    private initiateDownload(){
        this.fileService.downloadFile(this.resourceId)
        .pipe(
            takeUntil(this.destroy$),
            tap(response => {
                this.downloadFile(
                    response.body, 
                    this.parseFilename(response),
                    response.headers.get('Content-Type')
                );
            })
        ).subscribe();
    }

    private parseFilename(response): string {
        let contentDisposition = response.headers.get('Content-Disposition');
        if (!contentDisposition){
            // google bucket storage, for instance, does not return the header.
            // However, we can get the name by parsing the url:
            let urlComponents = response.url.split('?');
            let urlBase = urlComponents[0].split('/').pop();
            return urlBase;
        } else {
            let matches = /filename="(.*?)"/g.exec(contentDisposition);
            return matches && matches.length > 1 ? matches[1] : null;
        }
    }

    private downloadFile(data: Blob, filename: string, contentType: string) {
        const blob = new Blob([data], {type: contentType});
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            if (link.download !== undefined) {

                // Browsers that support HTML5 download attribute
                const url = URL.createObjectURL(blob);

                link.setAttribute('href', url);
                if(filename !== null){
                    link.setAttribute('download', filename);
                }
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}