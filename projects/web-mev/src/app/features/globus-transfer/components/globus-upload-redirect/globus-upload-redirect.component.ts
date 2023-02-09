import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { GlobusService } from '@app/features/globus-transfer/services/globus';

@Component({
  selector: 'upload-redirect',
  templateUrl: './globus-upload-redirect.component.html'
})
export class GlobusUploadRedirectComponent implements OnInit {

  transfer_id: string = '';
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private globusService: GlobusService
  ) 
  { }

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.pipe(
      switchMap(
        data => {
          console.log('DATA');
          console.log(data);
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
        console.log('Transfer info:');
        console.log(transfer_info);
        //this.transfer_id = transfer_info['transfer_id'];
        this.router.navigate(['/workarea']);
      }
    )
  }
}
