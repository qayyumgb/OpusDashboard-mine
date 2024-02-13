import { Component } from '@angular/core';
import {UrlNavigationInterceptorService} from "./services/url-navigation-interceptor.service";
//import {PresenceService} from "./presence.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'opus-dashboard';

  constructor(private urlNavigationService: UrlNavigationInterceptorService,
              /*private presenceService: PresenceService*/) {
  }
}
