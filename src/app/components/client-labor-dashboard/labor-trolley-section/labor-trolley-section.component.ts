import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {Subscription} from "rxjs";
import {DatePipe} from "@angular/common";
import {FirestoreService} from "../../../services/firestore.service";
import {AuthService} from "../../../services/auth.service";
import {ActivatedRoute} from "@angular/router";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import * as moment from "moment";
import {TrolleyMainAttributes} from "../../../common/interfaces/trolley-interfaces";

@Component({
  selector: 'app-labor-trolley-section',
  templateUrl: './labor-trolley-section.component.html',
  styleUrls: ['./labor-trolley-section.component.scss',
    '../../../common/styles/listing.scss']
})
export class LaborTrolleySectionComponent implements AfterViewInit, OnDestroy {
  unArchivedVsArchived = 'unarchived';
  workerAttributesReadableMap: Map<string, string> = new Map([
    ['trolleyId', 'Trolley Number'],
    ['workerName', 'Worker'],
    ['timeRange', 'Time'],
    ['rowNumber', 'Row'],
    ['varietyName', 'Variety'],
    ['count', 'Count']
  ]);

  columnsToDisplay: string[] = ['trolleyId', 'workerName', 'timeRange', 'rowNumber', 'varietyName', 'count'];
  columnsHeadersToDisplay: string[] = [
    'trolleyId',
    'workerName',
    'timeRange',
    'rowNumber',
    'varietyName',
    'count',
  ];
  dataSource: MatTableDataSource<TrolleyMainAttributes>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public sessionsData: [];
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  selectedClientDocData: any;
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  clientInContextServiceSubscription: Subscription;
  sessionsDataSubscription: Subscription;
  archivedWorkersSubscription: Subscription;
  locationListSubscription: Subscription;
  allLocationsList: any[];
  filterValue: string;
  private dateInContextSubscription: Subscription;
  selectedDate: Date;

  constructor(
    public firestoreService: FirestoreService,
    public authService: AuthService,
    public route: ActivatedRoute,
    private dialog: MatDialog,
    private clientInContextService: ClientInContextService,
    private snackBar: MatSnackBar
  ) {
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );

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
          this.sessionsData = [];
          this.loadTrolleyTable();
        });
      });
  }


  ngAfterViewInit() {
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.sessionsDataSubscription?.unsubscribe();
    this.archivedWorkersSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
  }


  loadTrolleyTable() {
    const dateToQuery = moment(this.selectedDate).format('YYYY-MM-DD');
    this.sessionsDataSubscription = this.firestoreService
      .getUnarchivedSessions(this.selectedClientDocData.id, dateToQuery)
      .subscribe((sessions) => {
        sessions = sessions.filter(session => session.rowId !== null && session.rowId !== '');
        this.sessionsData = sessions.map((session) => {
          session.timeRange = `${session?.startTimestamp ? moment(session?.startTimestamp?.toMillis()).format('HH:mm') : ''}
          - ${session?.endTimestamp ? moment(session?.endTimestamp?.toMillis()).format('HH:mm') : ''}`;
          const isOriginal = session.hasOwnProperty('isOriginal') ? session.isOriginal : true;
          if (this.selectedClientDocData.correctionFactor && session.count && isOriginal && !session.isManual) {
            session.count = +(session.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
          }
          return {
            ...session,
          };
        });

        this.sessionsData.sort((a: any, b: any) => moment(b.startTimestamp).isBefore(moment(a.startTimestamp)) ? 1 : -1);

        this.dataSource = new MatTableDataSource(this.sessionsData);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.dataSource.filterPredicate = (record: any, filter: string) => {
          return (record.trolleyId?.trim().toLowerCase().indexOf(filter) !== -1) ||
            (record.rowNumber?.trim().toLowerCase().indexOf(filter) !== -1) ||
            (record.varietyName?.trim().toLowerCase().indexOf(filter) !== -1) ||
            (record.workerName?.trim().toLowerCase().indexOf(filter) !== -1);
        };
        this.initiateFiltering();
      });
  }

  initiateFiltering() {
    if (this.filterValue) {
      this.dataSource.filter = this.filterValue.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

}
