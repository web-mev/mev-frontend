import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { GlobusService } from '@app/features/globus-transfer/services/globus';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';

@Component({
  selector: 'download-redirect',
  templateUrl: './globus-download-redirect.component.html',
  styleUrls: ['./globus-download-redirect.component.scss']
})
export class GlobusDownloadRedirectComponent implements OnInit {

  transfer_id: string = '';
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private globusService: GlobusService,
    private storage: LclStorageService,
  ) 
  { }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.pipe(
      switchMap(
        data => {
          console.log('DATA');
          console.log(data);
          // Data looks like:
            // {
            //   "label": "some-downloasd",
            //   "endpoint": "u_g7ecxtlierebnaxdeayipv5nga#6a30d5da-9b8e-11ed-b575-33287ee02ec7",
            //   "path": "/~/Downloads/",
            //   "endpoint_id": "6a30d5da-9b8e-11ed-b575-33287ee02ec7",
            //   "entity_type": "GCP_mapped_collection",
            //   "high_assurance": "false",
            //   "action": "http://localhost:4200/globus/download-redirect/",
            //   "method": "GET",
            //   "folderlimit": "1",
            //   "filelimit": "0"
            // }
          let pk = this.storage.get('resource_pk');
          data['pk_set'] = [pk];
          return this.globusService.startGlobusDownload(data);
        }
      )
    ).subscribe(
      transfer_info => {
        this.router.navigate(['/workarea']);
      }
    )
  }
}
