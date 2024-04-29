import { Component } from '@angular/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import { Subscription } from 'rxjs';
import { ClientInContextService } from 'src/app/services/client-in-context.service';
import { EUROPEAN_DATE_FORMATS } from '../../utils/date-utils';

@Component({
  selector: 'app-date-selection',
  templateUrl: './date-selection.component.html',
  styleUrls: ['./date-selection.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {provide: MAT_DATE_FORMATS, useValue: EUROPEAN_DATE_FORMATS}
  ]
})
export class DateSelectionComponent {


  
  dateToday: Date = new Date();
  selectedDate: Date;

  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  dateInContextSubscription: Subscription;
  constructor(
    private clientInContextService: ClientInContextService,){
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


  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
  }
}
