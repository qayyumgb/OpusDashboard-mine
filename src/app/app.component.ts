import { Component } from '@angular/core';
import {UrlNavigationInterceptorService} from "./services/url-navigation-interceptor.service";
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
//import {PresenceService} from "./presence.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'opus-dashboard';
 isLoggedIn:boolean = true
  constructor(private urlNavigationService: UrlNavigationInterceptorService,private router: Router
              /*private presenceService: PresenceService*/) {
                this.router.events.pipe(
                  filter(event => event instanceof NavigationEnd)
                ).subscribe((event: NavigationEnd) => {
                  // Perform actions based on the current router path URL
                  console.log('Current URL:', event.url);
                  this.isLoggedIn = event.url.includes('dashboard');
                 
                });
  }
}
