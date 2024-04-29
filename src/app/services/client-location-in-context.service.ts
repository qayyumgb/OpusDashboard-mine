import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Router} from '@angular/router';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClientLocationInContextService {

  clientLocationInContextSubject = new BehaviorSubject(null);
  clientLocationInContext: any;

  dateInContextSubject = new BehaviorSubject(null);
  dateInContext: Date;

  constructor(private router: Router, private authService: AuthService) {
    this.clientLocationInContextSubject.subscribe({
      next: (clientLocationInContextObject) => {
        this.clientLocationInContext = clientLocationInContextObject;
      }
    });

    this.dateInContextSubject.subscribe({
      next: (dateInContext) => {
        this.dateInContext = dateInContext;
        //console.log('Client change event captured in client-in-context-service with clientDocData:' + JSON.stringify(dateInContext))
      }
    });
  }
}
