import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {ActivitySession, Column, SessionMainAttributes} from '../../common/interfaces/new-table-interfaces';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {FirestoreService} from '../../services/firestore.service';
import {Router} from '@angular/router';
import {ClientInContextService} from '../../services/client-in-context.service';
import * as moment from 'moment';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {SNACKBAR_CLASSES} from '../../common/utils/utils';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {EditSessionDialogComponent} from "./edit-session-dialog/edit-session-dialog.component";
import {CreateSessionDialogComponent} from "./create-session-dialog/create-session-dialog.component";
import {ConfirmationDialogComponent} from "../utility/confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: 'app-client-sessions-dashboard',
  templateUrl: './client-sessions-dashboard.component.html',
  styleUrls: ['./client-sessions-dashboard.component.scss',
    '../../common/styles/listing.scss'],
    animations: [
      trigger('detailExpand', [
        state('collapsed', style({height: '0px', minHeight: '0'})),
        state('expanded', style({height: '*'})),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      ]),
    ],
})
export class ClientSessionsDashboardComponent implements AfterViewInit, OnDestroy {
  columns: Column[] = [
    {
      name: 'workerName',
      displayName: 'Worker',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: false,
      footerType: null,
      footerValue: '',
    },
    {
      name: 'timeRange',
      displayName: 'Time',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: null,
      footerValue: '',
    },
    {
      name: 'rowNumber',
      displayName: 'Row',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: null,
      footerValue: '',
    },
    {
      name: 'trolleyId',
      displayName: 'Trolley',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: null,
      footerValue: '',
    },
    {
      name: 'varietyName',
      displayName: 'Variety',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: null,
      footerValue: '',
    },
    {
      name: 'count',
      displayName: 'Count',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: false,
      footerType: null,
      footerValue: '',
    },
    {
      name: 'locationName',
      displayName: 'Location',
      showHeader: false,
      showHeaderFilter: false,
      showTopFilter: true,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: false,
      footerType: null,
      footerValue: '',
    }
  ];

  toggleTableChart: 'table' | 'chart' = 'table';
  unArchivedVsArchived = 'unarchived';

  // TABLE
  displayedColumns: string[] = this.columns
    .filter((column) => column.showHeader)
    .map((column) => column.name);

  displayedTopFilters: any[] = this.columns.filter(
    (column) => column.showTopFilter
  );

  dataSource: MatTableDataSource<SessionMainAttributes>;
  lastDirection: '' | 'asc' | 'desc' = '';
  filterDictionary = new Map<string, string | number | boolean>();

  expandedElement: any = null;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dateInContextSubscription: Subscription;
  selectedDate: Date;
  prdctvtyRowData: any[];
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  sessionsRawData: any[];
  filterString: string;
  archivedSessionsSubscription: Subscription;
  unarchivedSessionsSubscription: Subscription;
  displayedIcon = 'play_circle_outline';
  shownRecordsType = 'unarchived';
  tableData = [];
  dateToday: Date = new Date();
  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private snackBar: MatSnackBar,
              private dialog: MatDialog,
              private clientInContextService: ClientInContextService) {

    this.dateInContextSubscription = this.clientInContextService.dateInContextSubject
      .subscribe(dateInContext => {
        if (!dateInContext) {
          const dateNow = new Date();
          this.selectedDate = dateNow;
          this.clientInContextService.dateInContextSubject.next(dateNow);
        } else {
          this.selectedDate = dateInContext;
        }
        this.prdctvtyRowData = [];

        this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
          if (!selectedClientDocData) {
            return;
          }
          this.selectedClientDocData = selectedClientDocData;
          this.fetchUnarchivedSessions(false);
        });
      });
  }
  futureFilter = (d: Date | null): boolean => {
    return d <= this.dateToday;
  };
  ngAfterViewInit() {

  }

  getDisplayedCols() {
    return [...this.displayedColumns, 'edit', 'manual_indicator'];
  }

  fetchUnarchivedSessions(continueStreaming) {
    this.archivedSessionsSubscription?.unsubscribe();
    this.unarchivedSessionsSubscription =
      this.firestoreService.getUnarchivedSessions(this.selectedClientDocData.id, this.selectedDate)
        .subscribe(sessions => {
          this.sessionsRawData = sessions;
          this.tableData = sessions
            .map(session => {
              const originalSession = {...session};
              const startTimestamp = session?.startTimestamp ? moment(session?.startTimestamp?.toMillis()).format('HH:mm') : '';
              const endTimestamp = session?.endTimestamp ? moment(session?.endTimestamp?.toMillis()).format('HH:mm') : '';
              const nettStartTimestamp = session?.nettStartTimestamp ? moment(session?.nettStartTimestamp?.toMillis()).format('HH:mm') : '';
              const nettEndTimestamp = session?.nettEndTimestamp ? moment(session?.nettEndTimestamp?.toMillis()).format('HH:mm') : '';
              const isOriginal = session.hasOwnProperty('isOriginal') ? session.isOriginal : true;
              const fixAllowed =
                (session.isManual || !isOriginal) ? false : !session.hasOwnProperty('fixRequestedAt') ||
                  (['FIXED', 'FAILED'].includes(session.fixStatus)) ||
                  (session.fixStatus === 'FIXING'
                    && (session.fixingAt && moment().diff(session.fixingAt?.toDate(), 'minutes') > 10)
                  );
              const fixFailed = session.hasOwnProperty('fixRequestedAt') && ['FAILED'].includes(session.fixStatus); //'FIXED' can be added to this list to avoid re-fixing
              if (this.selectedClientDocData.correctionFactor && session.count && isOriginal && !session.isManual) {
                session.count = +(session.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
              }
              return {
                originalSessionDocument: originalSession,
                editButtonClass: !isOriginal ? '' : 'listing-table-tools tdhover',
                fixButtonClass: session.hasOwnProperty('fixRequestedAt') ? '' : 'listing-table-tools tdhover',
                workerId: session.workerId,
                workerName: session.workerName,
                locationId: session.locationId,
                locationName: session.locationName,
                layoutId: session.layoutId,
                layoutName: session.layoutName,
                timeRange: `${startTimestamp} - ${endTimestamp}`,
                count: session.count ?? 0,
                rowId: session.rowId,
                rowNumber: session.rowNumber,
                varietyId: session.varietyId ?? '',
                varietyName: session.varietyName ?? '',
                trolleyId: session.trolleyId ?? '',
                sessionId: session.id ?? '',
                deviceId: session.deviceId ?? '',
                nettPerformance: session.nettPerformance ? session.nettPerformance.toFixed(0) + '  ( ' + nettStartTimestamp + ' - ' + nettEndTimestamp + ' )' : '-',
                grossPerformance: session.grossPerformance ? session.grossPerformance.toFixed(0) + '  ( ' + startTimestamp + ' - ' + endTimestamp + ' )' : '-',
                deviceNumber: session.deviceNumber ?? '',
                startTs: session.startTimestamp,
                endTs: session.endTimestamp,
                isArchived: session.isArchived,
                isManual: session.hasOwnProperty('isManual') ? session.isManual : false,
                isOriginal,
                fixAllowed,
                fixFailed,
                failureReason: fixFailed ? session.failureMessage : ''
              }
            });

          this.tableData.sort((n1, n2) => {
            return +n1.startTimestamp > +n2.startTimestamp ? -1 : +n1.startTimestamp < +n2.startTimestamp ? 1 : 0;
          });

          this.dataSource = new MatTableDataSource(this.tableData);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;

          this.dataSource.filterPredicate = (record, filter) => {
            const map = new Map(JSON.parse(filter));
            const returnValues = [];

            for (const [key, value] of map) {
              // @ts-ignore
              const recordValue: string | number | boolean | undefined =
                record[key as keyof ActivitySession];

              if (typeof recordValue === 'string') {
                const regex = new RegExp(`${value}`, 'i');
                returnValues.push(regex.test(recordValue));
              }
              if (typeof recordValue === 'number') {
                returnValues.push(recordValue === Number(value));
              }
              if (typeof recordValue === 'boolean') {
                returnValues.push(recordValue === value);
              }
            }
            return returnValues.every(Boolean);
          };
          this.postProcessingFilterSort();
          if (!continueStreaming) {
            this.unarchivedSessionsSubscription?.unsubscribe();
          }
        });
  }

  fetchArchivedSessions(continueStreaming) {
    this.unarchivedSessionsSubscription?.unsubscribe();
    this.archivedSessionsSubscription =
      this.firestoreService.getArchivedSessions(this.selectedClientDocData.id, this.selectedDate)
        .subscribe(sessions => {
          this.sessionsRawData = sessions;
          this.tableData = sessions
            .map(session => {
              return this.getTableRowForSessionDoc(session);
            });

          this.tableData.sort((n1, n2) => {
            return +n1.startTimestamp > +n2.startTimestamp ? -1 : +n1.startTimestamp < +n2.startTimestamp ? 1 : 0;
          });

          this.dataSource = new MatTableDataSource(this.tableData);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;

          this.dataSource.filterPredicate = (record, filter) => {
            const map = new Map(JSON.parse(filter));
            const returnValues = [];

            for (const [key, value] of map) {
              // @ts-ignore
              const recordValue: string | number | boolean | undefined =
                record[key as keyof ActivitySession];

              if (typeof recordValue === 'string') {
                const regex = new RegExp(`${value}`, 'i');
                returnValues.push(regex.test(recordValue));
              }
              if (typeof recordValue === 'number') {
                returnValues.push(recordValue === Number(value));
              }
              if (typeof recordValue === 'boolean') {
                returnValues.push(recordValue === value);
              }
            }
            return returnValues.every(Boolean);
          };
          this.postProcessingFilterSort();
          if (!continueStreaming) {
            this.archivedSessionsSubscription?.unsubscribe();
          }
        });

  }

  /**
   * Sorts the list of columns based on the specified column name and direction.
   *
   * @param  columnName - The name of the column to sort by.
   * @param  direction - The sorting direction, either 'asc' (ascending) or 'desc' (descending).
   * @returns void
   */
  sortList(columnName: string, direction: 'asc' | 'desc'): void {
    this.columns.forEach((column, index) => {
      this.columns[index].filtered = column.name === columnName;
    });
    if (!this.dataSource.sort) {
      return;
    }
    if (
      direction === 'asc' &&
      (this.dataSource.sort.direction !== 'asc' ||
        this.dataSource.sort.active !== columnName)
    ) {
      this.dataSource.sort.sort({
        id: columnName,
        start: 'asc',
        disableClear: true,
      });
    } else if (
      direction === 'desc' &&
      (this.dataSource.sort.direction !== 'desc' ||
        this.dataSource.sort.active !== columnName)
    ) {
      this.dataSource.sort.sort({
        id: columnName,
        start: 'desc',
        disableClear: true,
      });
    }
    this.postProcessingFilterSort();
  }

  /**
   * Applies header filter to the data based on the specified column name and filter value.
   *
   * @param event - The event object containing filter-related information.
   * @param columnName - The name of the column to be filtered.
   * @returns void
   */
  headerFilter(event: any, columnName: string): void {
    if (event.target.value) {
      this.filterDictionary.set(columnName, event.target.value);
    }
    if (!event.target.value) {
      this.filterDictionary.delete(columnName);
    }
    this.applyPredicateFilter();
    this.postProcessingFilterSort();
  }

  applyPredicateFilter(): void {
    const jsonString = JSON.stringify(
      Array.from(this.filterDictionary.entries())
    );
    this.dataSource.filter = jsonString;
    const filters: string[] = [];
    this.filterDictionary.forEach((value, key) => {
      if (key !== 'archived') {
        filters.push(`${key}: ${value}`);
      }
    });
    this.filterString = filters.length > 0 ? 'Filtered on' + filters.join(' and ') : '';
  }

  /**
   * Applies a predicate filter to the data source using the filter dictionary.
   * Converts the filter dictionary to a JSON string and sets it as the data source filter.
   *
   */
  postProcessingFilterSort(): void {
    this.columns.forEach((column, index) => {
      if (
        this.dataSource.sort?.active === column.name ||
        column.filterValue !== ''
      ) {
        column.filtered = true;
      } else {
        column.filtered = false;
      }
    });

    this.columns.forEach((column, columnIndex) => {
      this.columns[columnIndex].filterOptions = [];
      const optionsSet: Set<any> = new Set();
      this.dataSource.filteredData.forEach((row, rowIndex) => {
        for (const [key, value] of Object.entries(row)) {
          if (key === column.name) {
            optionsSet.add(value);
          }
        }
      });
      column.filterOptions = [...optionsSet].sort();
    });

    this.columns.forEach((column, columnIndex) => {
      const footerType = this.columns[columnIndex].footerType;
      const filteredDatasource: any[] = [];
      this.dataSource.filteredData.forEach((row, rowIndex) => {
        for (const [key, value] of Object.entries(row)) {
          if (key === column.name) {
            filteredDatasource.push(value);
          }
        }
      });
      if (footerType === 'total') {
        column.footerValue = 'Total';
      }
      if (footerType === 'sum') {
        column.footerValue = filteredDatasource.reduce(
          (accumulator, currentValue) => {
            return accumulator + currentValue;
          },
          0
        );
      }
      if (footerType === 'count') {
        column.footerValue = filteredDatasource.length;
      }
    });
  }

  /**
   * Clears filters and resets sorting for the data source.
   */
  removeFilters(): void {
    this.filterString = '';
    this.lastDirection = '';
    this.filterDictionary.clear();
    this.columns.forEach((column, index) => {
      this.columns[index].filterValue = '';
    });
    if (this.dataSource.sort) {
      this.dataSource.sort.active = '';
      this.dataSource.sort.direction = '';
      this.dataSource.filter = '';
    }
    this.postProcessingFilterSort();
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

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
    this.archivedSessionsSubscription?.unsubscribe();
    this.unarchivedSessionsSubscription?.unsubscribe();
  }

  downloadAsCSV(type: string) {
    const filename = `${type} ${moment(this.selectedDate).format('YYYY-MM-DD')}`;
    if (!this.sessionsRawData || (this.sessionsRawData.length === 0)) {
      return;
    }
    const csvData = this.ConvertToCSV(this.sessionsRawData, this.columns.filter(column => column.showHeader).map(column => column.name));
    const blob = new Blob(['\ufeff' + csvData], {type: 'text/csv;charset=utf-8;'});
    const dwldLink = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
      dwldLink.setAttribute('target', '_blank');
    }
    dwldLink.setAttribute('href', url);
    dwldLink.setAttribute('download', filename + '.csv');
    dwldLink.style.visibility = 'hidden';
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  getTableRowForSessionDoc(session) {
    const originalSession = {...session};
    const startTimestamp = session?.startTimestamp ? moment(session?.startTimestamp?.toMillis()).format('HH:mm') : '';
    const endTimestamp = session?.endTimestamp ? moment(session?.endTimestamp?.toMillis()).format('HH:mm') : '';
    const nettStartTimestamp = session?.nettStartTimestamp ? moment(session?.nettStartTimestamp?.toMillis()).format('HH:mm') : '';
    const nettEndTimestamp = session?.nettEndTimestamp ? moment(session?.nettEndTimestamp?.toMillis()).format('HH:mm') : '';
    const isOriginal = session.hasOwnProperty('isOriginal') ? session.isOriginal : true;
    const fixAllowed = session.isManual ? false : !session.hasOwnProperty('fixRequestedAt') ||
      (session.hasOwnProperty('fixRequestedAt') && !['REQUESTED', 'FIXING'].includes(session.fixStatus)); //'FIXED' can be added to this list to avoid re-fixing
    const fixFailed = session.hasOwnProperty('fixRequestedAt') && ['FAILED'].includes(session.fixStatus); //'FIXED' can be added to this list to avoid re-fixing
    if (this.selectedClientDocData.correctionFactor && session.count && session.isOriginal && !session.isManual) {
      session.count = +(session.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
    }
    return {
      originalSessionDocument: originalSession,
      editButtonClass: !isOriginal ? '' : 'listing-table-tools tdhover',
      fixButtonClass: session.hasOwnProperty('fixRequestedAt') ? '' : 'listing-table-tools tdhover',
      workerId: session.workerId,
      workerName: session.workerName,
      locationId: session.locationId,
      locationName: session.locationName,
      layoutId: session.layoutId,
      layoutName: session.layoutName,
      timeRange: `${startTimestamp} - ${endTimestamp}`,
      count: session.count ?? 0,
      rowId: session.rowId,
      rowNumber: session.rowNumber,
      varietyId: session.varietyId ?? '',
      varietyName: session.varietyName ?? '',
      trolleyId: session.trolleyId ?? '',
      sessionId: session.id ?? '',
      deviceId: session.deviceId ?? '',
      nettPerformance: session.nettPerformance ? session.nettPerformance.toFixed(0) + '  ( ' + nettStartTimestamp + ' - ' + nettEndTimestamp + ' )' : '-',
      grossPerformance: session.grossPerformance ? session.grossPerformance.toFixed(0) + '  ( ' + startTimestamp + ' - ' + endTimestamp + ' )' : '-',
      deviceNumber: session.deviceNumber ?? '',
      startTs: session.startTimestamp,
      endTs: session.endTimestamp,
      isArchived: session.isArchived,
      isManual: session.hasOwnProperty('isManual') ? session.isManual : false,
      isOriginal,
      fixAllowed,
      fixFailed,
      failureReason: fixFailed ? session.failureMessage : ''
    }
  }

  ConvertToCSV(objArray, headerList) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = '';

    for (const header of headerList) {
      row += this.columns.filter(column => column.name === header)[0].displayName + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < array.length; i++) {
      let line = '';
      let counter = 0;
      for (const header of headerList) {
        counter++;
        if (['startTimestamp', 'endTimestamp'].includes(header)) {
          line += ((array[i][header] ? moment(+array[i][header].toMillis()).format('HH:mm') : null) ?? '');
        } else {
          line += (array[i][header] ?? '');
        }
        if (counter < headerList.length) {
          line += ','
        }
      }
      str += line + '\r\n';
    }
    return str;
  }

  async copyAsTraining($event, sessionRecord) {
    $event.stopPropagation();
    try {
      const newTraininDocRef = await this.firestoreService.copySessionToNewTraining(this.sessionsRawData.filter(sess => sess.id === sessionRecord.sessionId)[0]);
      await this.router.navigate([`/annotations/${newTraininDocRef.id}`]);
      this.openSnackBar(`Training has been created successfully using session`, 'success');
    } catch (error) {
      console.log(JSON.stringify(error.message));
      this.openSnackBar(`Training could not be created from session due to an error:${error.message}`, 'failure');
    }
  }

  async editSession($event, sessionRecord) {
    $event.stopPropagation();
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      sessionRecord
    };
    const dialogRef = this.dialog.open(EditSessionDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(async (res) => {
      if (res?.data?.id) {
        const singleSessionSubscription =
          this.firestoreService.getSessionByIdForClientId(res.data.id, this.selectedClientDocData.id).subscribe(updatedSessionDS => {
            const updatedTableData = this.tableData.map(row => {
              if (row.sessionId === res.data.id) {
                return this.getTableRowForSessionDoc(updatedSessionDS.data())
              } else {
                return row;
              }
            });
            this.dataSource = new MatTableDataSource(updatedTableData);
            singleSessionSubscription?.unsubscribe();
          });
      }
    });
  }

  expandRow(element: any) {
    this.expandedElement = this.expandedElement?.sessionId === element.sessionId ? null : element;
  }

  applyExpandedClass(element: any) {
    return this.expandedElement?.sessionId === element.sessionId;
  }

  openSnackBar(message, type, duration?) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: duration ? duration : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  toggleArchived(isArchivedSelected: boolean) {
    if (!isArchivedSelected) {
      this.shownRecordsType = 'unarchived';
      this.fetchUnarchivedSessions(this.displayedIcon !== 'play_circle_outline');
    } else {
      this.fetchArchivedSessions(this.displayedIcon !== 'play_circle_outline');
      this.shownRecordsType = 'archived';
    }
  }

  archiveSession($event, session) {
    $event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive the session?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        session
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value?.decision) {
        try {
          await this.firestoreService.archiveSessionByIdForClientId(value?.session?.sessionId, this.selectedClientDocData.id);
          this.snackBar.open(`Session archived successfully`, '', {
            duration: 5000,
            panelClass: ['snackbar-success'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
          this.fetchUnarchivedSessions(this.displayedIcon !== 'play_circle_outline');
        } catch (error) {
          this.snackBar.open(`Error in archiving session.\nPlease try again and/or contact support if problem persists`, '', {
            panelClass: ['snackbar-error'],
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
    });
  }

  async unarchiveSession($event, session) {
    $event.stopPropagation();
    try {
      await this.firestoreService.unArchiveSessionByIdForClientId(session?.sessionId, this.selectedClientDocData.id);
      this.snackBar.open(`Session unarchived successfully`, '', {
        duration: 5000,
        panelClass: ['snackbar-success'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      this.fetchArchivedSessions(this.displayedIcon !== 'play_circle_outline');
    } catch (error) {
      this.snackBar.open(`Error in unarchiving session.\nPlease try again and/or contact support if problem persists`, '', {
        panelClass: ['snackbar-error'],
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  async fixSession($event, session) {
    $event.stopPropagation();
    try {
      await this.firestoreService.updateSessionForClientId({
        fixRequestedAt: new Date(),
        fixStatus: 'REQUESTED',
        id: session.sessionId
      }, this.selectedClientDocData.id, false);
      this.snackBar.open(`Session fixing request raised successfully. Restart Streaming(if paused) to see result.`, '', {
        duration: 10000,
        panelClass: ['snackbar-success'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      if (session.isArchived) {
        this.fetchArchivedSessions(this.displayedIcon !== 'play_circle_outline');
      } else {
        this.fetchUnarchivedSessions(this.displayedIcon !== 'play_circle_outline');
      }
    } catch (error) {
      this.snackBar.open(`Error in raising fixing request for session.\nPlease try again and/or contact support if problem persists`, '', {
        panelClass: ['snackbar-error'],
        duration: 6000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  openCreateSessionDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = {};
    this.dialog.open(CreateSessionDialogComponent, dialogConfig);
  }

  getTooltipForStreamingButton() {
    if (this.displayedIcon === 'play_circle_outline') {
      return 'Start Streaming Data';
    } else {
      return 'Pause Streaming Data';
    }
  }

  toggleStreaming() {
    if (this.displayedIcon === 'play_circle_outline') {
      this.displayedIcon = 'pause_circle_outline';
      if (this.shownRecordsType === 'unarchived') {
        this.fetchUnarchivedSessions(true);
      } else {
        this.fetchArchivedSessions(true);
      }
    } else {
      if (this.shownRecordsType === 'unarchived') {
        this.unarchivedSessionsSubscription?.unsubscribe();
      } else {
        this.archivedSessionsSubscription?.unsubscribe();
      }
      this.displayedIcon = 'play_circle_outline';
    }
  }

  getFailedToolTip(element) {
    return {
      topline: `Re-initiate failed attempt to fix`,
      bottomLine: `${element.failureReason}`
    }
  }

}
