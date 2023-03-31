import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';

import { NotificationService } from '@app/core/core.module';

import { GlobusService } from '@app/features/globus-transfer/services/globus';

@Component({
  selector: 'upload-redirect',
  templateUrl: './globus-upload-redirect.component.html',
  styleUrls: ['./globus-upload-redirect.component.scss']
})
export class GlobusUploadRedirectComponent implements OnInit {

  transfer_id: string = '';
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private globusService: GlobusService,
    private notificationService: NotificationService
  ) 
  { }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.pipe(
      switchMap(
        data => {
          // Data looks like:
          //  { 
          //     ​action: "http://localhost:4200/globus/redirect/"
          //     endpoint: "go#ep1"
          //     endpoint_id: "ddb59aef-6d04-11e5-ba46-22000b92c6ec"
          //     "file[0]": "file1.txt"
          //     "file[1]": "file2.txt"
          //     label: ""
          //     method: "GET"
          //     path: "/share/godata/"
          //   }
          return this.globusService.startGlobusUpload(data);
        }
      )
    ).subscribe(
      transfer_info => {
        if ('error' in transfer_info){
          this.notificationService.warn(transfer_info['error'],15000);

        } else if (transfer_info['transfer_id'] === null){
          this.notificationService.warn('There was a problem submitting the transfer. An admin has been notified, but you may attempt the transfer again.',15000);
        }
        this.router.navigate(['/workarea']);
      }
    )
  }
}
