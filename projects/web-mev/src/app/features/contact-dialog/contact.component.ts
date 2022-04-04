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
    let endPoint = `${this.API_URL}/feedback/`
    this.postData(endPoint, { "message": event.target.comments.value }).subscribe(res => {
      this.notificationService.warn("The message has been successfully sent to our developers. We appreciate your feedback and will get back to you soon.");
    })
  }

  postData(url: string, postMessage: {}){
    return this.httpClient.post(url, postMessage).pipe(
      catchError(error => {
          console.log("Error: ", error);
          this.notificationService.error(`Error: ${error}`);
          throw error;
      }))
  }
}