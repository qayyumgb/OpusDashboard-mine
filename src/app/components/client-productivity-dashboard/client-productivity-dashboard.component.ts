import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS} from '@angular/material-moment-adapter';
import {ActivatedRoute, Router} from "@angular/router";
import {FirestoreService} from "../../services/firestore.service";
import {ClientInContextService} from "../../services/client-in-context.service";
import {Subscription} from "rxjs";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {EUROPEAN_DATE_FORMATS} from "../../common/utils/date-utils";
import * as moment from "moment/moment";


@Component({
  selector: 'app-client-productivity-dashboard',
  templateUrl: './client-productivity-dashboard.component.html',
  styleUrls: ['./client-productivity-dashboard.component.scss',
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
export class ClientProductivityDashboardComponent implements OnInit, OnDestroy {

  dateToday: Date = new Date();
  selectedDate: Date;

  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  dateInContextSubscription: Subscription;
  tabIndex: number;
  isRowMapTabShown = false;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService) {

    const url = this.router.url;

    switch (url) {
      case '/dashboard/productivity/rowmap':
        this.isRowMapTabShown = true;
        this.tabIndex = 0;
        break;
      case '/dashboard/productivity/row':
        this.tabIndex = 1;
        break;
      case '/dashboard/productivity/variety':
        this.tabIndex = 2;
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

  navigateToRowTab() {
    this.tabIndex = 1;
    this.isRowMapTabShown = false;
    this.router.navigate(['/dashboard/productivity/row']);
  }

  navigateToRowMapTab() {
    this.tabIndex = 0;
    this.isRowMapTabShown = true;
    this.selectedDate = new Date();
    this.router.navigate(['/dashboard/productivity/rowmap']);
  }

  navigateToVarietyTab() {
    this.tabIndex = 2;
    this.isRowMapTabShown = false;
    this.router.navigate(['/dashboard/productivity/variety']);
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
