import { Component, OnInit, Input } from '@angular/core';
import { LclStorageService } from '@app/core/local-storage/lcl-storage.service';
import { UserService } from '@app/core/user/user.service';

@Component({
  selector: 'user-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class UserInfoComponent implements OnInit {

  email: string = '';

  constructor(
    private storage: LclStorageService,
    private userService: UserService
  ) {

  }

  ngOnInit(): void {
    console.log('init info')
    this.userService.currentUserEmail.subscribe(
        email => {
            console.log('IN SUBSCRIBE!!!!');
            console.log(email);
            this.email = email;
        }
    );
  }
}
