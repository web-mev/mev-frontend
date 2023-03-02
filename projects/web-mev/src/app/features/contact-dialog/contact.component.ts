import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { NotificationService } from '@core/notifications/notification.service';
import { catchError } from "rxjs/operators";

@Component({
  selector: 'contact-component',
  templateUrl: 'contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent {
  private readonly API_URL = environment.apiUrl;

  constructor(
    private httpClient: HttpClient,
    private readonly notificationService: NotificationService
  ) { }

  onSubmit(event: any) {
    let endPoint = `${this.API_URL}/feedback/`;
    let msg = event.target.comments.value.trim();
    if(msg.length > 0){
      this.postData(endPoint, { "message": event.target.comments.value }).subscribe(
        res => {
          this.notificationService.warn("The message has been successfully sent to our developers. We appreciate your feedback and will get back to you soon.");
        }
      )
    }
  }

  postData(url: string, postMessage: {}){
    return this.httpClient.post(url, postMessage).pipe(
      catchError(error => {
          console.log("Error: ", error);
          let err_obj = error.error;
          let messages = err_obj.message;
          this.notificationService.error(`Error: ${messages.join()}`);
          throw error;
      }))
  }
}