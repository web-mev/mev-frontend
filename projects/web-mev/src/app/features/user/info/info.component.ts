import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '@app/core/user/user.service';

@Component({
  selector: 'user-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class UserInfoComponent implements OnInit {

  email: string = '';

  constructor(
    private userService: UserService
  ) {

  }

  ngOnInit(): void {
    this.userService.currentUserEmail.subscribe(
        email => {
            this.email = email;
        }
    );
  }
}
