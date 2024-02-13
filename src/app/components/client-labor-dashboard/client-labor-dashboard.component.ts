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
  tabIndex = 0;

  links = ['Overview', 'Trolley', 'Peformance', 'Productivity'];
  activeLink = this.links[0];

  dateToday: Date = new Date();
  selectedDate: Date;

  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  dateInContextSubscription: Subscription;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService,
              public route: ActivatedRoute) {
    const url = this.router.url;

    switch (url) {
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

    this.dateInContextSubscription = this.clientInContextService.dateInContextSubject
      .subscribe(dateInContext => {
        if (!dateInContext) {
          const dateNow = new Date();
          this.selectedDate = dateNow;
          this.clientInContextService.dateInContextSubject.next(dateNow);
        } else {
          this.selectedDate = dateInContext;
        }

        this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
          if (!selectedClientDocData) {
            return;
          }
          this.selectedClientDocData = selectedClientDocData;
        });
      });
  }

  futureFilter = (d: Date | null): boolean => {
    return d <= this.dateToday;
  };

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }

  decrementDate() {
    this.selectedDate = moment(this.selectedDate).subtract(1, 'day').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  decrementMonth() {
    this.selectedDate = moment(this.selectedDate).subtract(1, 'month').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  incrementDate() {
    this.selectedDate = moment(this.selectedDate).add(1, 'day').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  incrementMonth() {
    this.selectedDate = moment(this.selectedDate).add(1, 'month').toDate();
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  onDateChange() {
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }
}
