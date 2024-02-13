import {Injectable} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClientInContextService {

  clientInContextSubject = new BehaviorSubject(null);
  clientInContext: any;

  dateInContextSubject = new BehaviorSubject(null);
  dateInContext: Date;

  constructor(private router: Router, private authService: AuthService) {
    this.clientInContextSubject.subscribe({
      next: (clientInContextObject) => {
        this.clientInContext = clientInContextObject;
        this.authService.loggedInUserFromAuthService$.subscribe(
          (userDocData) => {
            if (this.clientInContext) {
              this.clientInContext.role = userDocData.clients.filter(client => client?.clientId === clientInContextObject?.id)[0]?.role;
              this.clientInContext.hasAdminRole = ['admin'].includes(this.clientInContext?.role);
              this.clientInContext.hasManagerOrAdminRole = ['admin', 'manager'].includes(this.clientInContext?.role);
              this.clientInContext.isDeveloper = userDocData.type === 'developer';
            }
          }
        );
        //console.log('Client change event captured in client-in-context-service with clientDocData:' + JSON.stringify(clientInContextObject))
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
