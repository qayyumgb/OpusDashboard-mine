import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {FirestoreService} from "./firestore.service";
import {ClientInContextService} from "./client-in-context.service";
import {AuthService} from "./auth.service";
import {findIndex} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UrlNavigationInterceptorService {
  private loggedInUserDocData: any;
  private navigationEvent: NavigationEnd;

  constructor(private router: Router,
              private firestoreService: FirestoreService,
              private clientInContextService: ClientInContextService,
              private authService: AuthService) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && event.url.startsWith('/dashboard')) {
        this.navigationEvent = event;
        const urlSegments = event.url.split('/');
        let dashboardVisited = '';
        if (urlSegments.includes('labor')) {
          dashboardVisited = 'labor'
        } else if (urlSegments.includes('productivity')) {
          dashboardVisited = 'productivity'
        } else if (urlSegments.includes('observations')) {
          dashboardVisited = 'observations'
        } else if (urlSegments.includes('registrations')) {
          dashboardVisited = 'registrations'
        } else if (urlSegments.includes('sessions')) {
          dashboardVisited = 'sessions'
        }
        const loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
          async (userDocData) => {
            loggedInUserFromAuthServiceSubscription?.unsubscribe();
            if (userDocData && (!userDocData.lastDashboardOpened || (userDocData.lastDashboardOpened !== dashboardVisited))) {
              await this.firestoreService.updateUserById(userDocData.id, {
                lastDashboardOpened: dashboardVisited
              });
            }
          });
      }
    });
  }
}
