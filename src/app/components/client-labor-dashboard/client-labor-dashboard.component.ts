import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {AuthService} from "../../services/auth.service";
import {FirestoreService} from "../../services/firestore.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ClientInContextService} from "../../services/client-in-context.service";
import * as moment from "moment";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from "@angular/material-moment-adapter";
import {EUROPEAN_DATE_FORMATS} from "../../common/utils/date-utils";

@Component({
  selector: 'app-client-labor-dashboard',
  templateUrl: './client-labor-dashboard.component.html',
  styleUrls: ['./client-labor-dashboard.component.scss',
    '../../common/styles/listing.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {provide: MAT_DATE_FORMATS, useValue: EUROPEAN_DATE_FORMATS}
  ]
})
export class ClientLaborDashboardComponent implements OnInit, OnDestroy {
  tabIndex = -1;

  links = ['Presences', 'Overview', 'Trolley', 'Peformance', 'Productivity'];
  activeLink = this.links[0];


  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              public route: ActivatedRoute) {
    const url = this.router.url;

    switch (url) {
      case '/dashboard/labor/presences':
        this.tabIndex = -1;
        break;
      case '/dashboard/labor/overview':
        this.tabIndex = 0;
        break;
      case '/dashboard/labor/trolley':
        this.tabIndex = 1;
        break;
      case '/dashboard/labor/performance':
        this.tabIndex = 2;
        break;
      case '/dashboard/labor/productivity':
        this.tabIndex = 3;
        break;
    }

  }


  ngOnDestroy(): void {
    
  }

  ngOnInit(): void {
  }

}
