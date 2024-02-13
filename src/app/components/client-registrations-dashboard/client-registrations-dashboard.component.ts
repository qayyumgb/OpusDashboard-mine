import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';

import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';

import {ActivitySession, Column} from '../../common/interfaces/new-table-interfaces';
import {AuthService} from '../../services/auth.service';
import {FirestoreService} from '../../services/firestore.service';
import {Router} from '@angular/router';
import {ClientInContextService} from "../../services/client-in-context.service";
import {Subscription} from 'rxjs';
import * as moment from 'moment/moment';
import {RegistrationMainAttributes} from '../../common/interfaces/clock-interfaces';
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../utility/confirmation-dialog/confirmation-dialog.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {EditRegistrationDialogComponent} from './edit-registration-dialog/edit-registration-dialog.component';
import {MatTooltipModule, TooltipPosition} from '@angular/material/tooltip';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-client-registrations-dashboard',
  templateUrl: './client-registrations-dashboard.component.html',
  styleUrls: ['./client-registrations-dashboard.component.scss',
    '../../common/styles/listing.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ClientRegistrationsDashboardComponent implements AfterViewInit, OnDestroy {
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
      showInFooter: true,
      footerType: 'total',
      footerValue: 'Totaal',
    },
    {
      name: 'startTimestamp',
      displayName: 'Start Timestamp',
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
      name: 'endTimestamp',
      displayName: 'End Timestamp',
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
      name: 'locationName',
      displayName: 'Location Name',
      showHeader: false,
      showHeaderFilter: false,
      showTopFilter: true,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: 'sum',
      footerValue: '',
    },
    {
      name: 'taskName',
      displayName: 'Task',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: 'count',
      footerValue: '',
    },
    {
      name: 'deviceType',
      displayName: 'Device',
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
      name: 'type',
      displayName: 'Type',
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
  ];

  toggleTableChart: 'table' | 'chart' = 'table';
  selectedView = 'listView';

  // TABLE
  displayedColumns: string[] = this.columns
    .filter((column) => column.showHeader)
    .map((column) => column.name);

  displayedTopFilters: any[] = this.columns.filter(
    (column) => column.showTopFilter
  );

  dataSource: MatTableDataSource<RegistrationMainAttributes>;
  lastDirection: '' | 'asc' | 'desc' = '';
  filterDictionary = new Map<string, string | number | boolean>();


  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dateInContextSubscription: Subscription;
  selectedDate: Date;
  prdctvtyRowData: any[];
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unArchivedRegnsSubscription: Subscription;
  archivedRegnsSubscription: Subscription;
  regnsRawData: any[];
  filterString: string;
  expandedElement: any = null;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) {

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
          this.fetchUnarchivedRegns();
        });
      });
  }

  ngAfterViewInit() {

  }

  getDisplayedCols() {
    return [...this.displayedColumns, 'edit'];
  }


  fetchArchivedRegns() {
    this.unArchivedRegnsSubscription?.unsubscribe();
    this.archivedRegnsSubscription =
      this.firestoreService
        .getArchivedRegnsForClientId(this.selectedClientDocData.id, this.selectedDate)
        .subscribe((regns: any[]) => {
          this.regnsRawData = regns;
          const tableData = this.mapFirestoreDataToTableData(regns);

          tableData.sort((n1, n2) => {
            return +n1.startTimestamp > +n2.startTimestamp ? -1 : +n1.startTimestamp < +n2.startTimestamp ? 1 : 0;
          });

          this.dataSource = new MatTableDataSource(tableData);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.setUpFiltering();
        });
  }

  fetchUnarchivedRegns() {
    this.archivedRegnsSubscription?.unsubscribe();
    this.unArchivedRegnsSubscription =
      this.firestoreService
        .getUnarchivedRegnsForClientId(this.selectedClientDocData.id, this.selectedDate)
        .subscribe((regns: any[]) => {
          if (this.selectedView === 'archiveView') {
            return;
          }
          this.regnsRawData = regns;
          const tableData = this.mapFirestoreDataToTableData(regns);

          tableData.sort((n1, n2) => {
            return +n1.startTimestamp > +n2.startTimestamp ? -1 : +n1.startTimestamp < +n2.startTimestamp ? 1 : 0;
          });

          this.dataSource = new MatTableDataSource(tableData);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.setUpFiltering();
        });
  }

  mapFirestoreDataToTableData(regns) {
    return regns.map(regn => {
      const startTimestamp = regn.startTimestamp ? moment(regn.startTimestamp.toMillis()).format('HH:mm') : '';
      const endTimestamp = regn.endTimestamp ? moment(regn.endTimestamp.toMillis()).format('HH:mm') : '';
      const isOriginal = regn.hasOwnProperty('isOriginal') ? regn.isOriginal : true;
      return {
        originalRegnDocument: regn,
        workerName: regn.workerName,
        locationName: regn.locationName,
        startTimestamp,
        endTimestamp,
        type: regn.taskId ? 'task' : 'position',
        deviceType: regn.deviceType,
        deviceId: regn.deviceId,
        deviceNumber: regn.deviceNumber,
        stepCounter: regn.stepCounter,
        rowNumber: regn.rowNumber,
        taskName: regn.taskName,
        id: regn.id,
        isArchived: regn.isArchived,
        workerId: regn.workerId,
        taskId: regn.taskId,
        locationId: regn.locationId,
        startTs: regn.startTimestamp ?? null,
        endTs: regn.endTimestamp ?? null,
        grandParentCollection: regn.grandParentCollection,
        parentPresenceId: regn.parentPresenceId,
        editButtonClass: !isOriginal ? '' : 'listing-table-tools tdhover',
        isOriginal
      }
    });
  }

  setUpFiltering() {
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

  toggleArchived(isArchivedSelected: boolean) {
    if (!isArchivedSelected) {
      this.fetchUnarchivedRegns();
    } else {
      this.fetchArchivedRegns();
    }
  }

  archiveRegistration($event, regn) {
    $event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive the registration?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        regn
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value?.decision) {
        try {
          if (value?.regn?.grandParentCollection === 'presences') {
            await this.firestoreService.archiveRegnBelowPresenceByIdForClientId(value?.regn?.id, this.selectedClientDocData.id, value?.regn?.parentPresenceId);
          } else {
            await this.firestoreService.archiveRegistrationByIdForClientId(value?.regn?.id, this.selectedClientDocData.id);
          }

          this.snackBar.open(`Registration archived successfully`, '', {
            duration: 5000,
            panelClass: ['snackbar-success'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        } catch (error) {
          this.snackBar.open(`Error in archiving registration.\nPlease try again and/or contact support if problem persists`, '', {
            panelClass: ['snackbar-error'],
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
    });
  }

  async unarchiveRegistration($event, regn) {
    $event.stopPropagation();
    try {
      if (regn?.grandParentCollection === 'presences') {
        await this.firestoreService.unArchiveRegnBelowPresenceByIdForClientId(regn?.id, this.selectedClientDocData.id, regn?.parentPresenceId);
      } else {
        await this.firestoreService.unArchiveRegistrationByIdForClientId(regn?.id, this.selectedClientDocData.id);
      }
      this.snackBar.open(`Registration unarchived successfully`, '', {
        duration: 5000,
        panelClass: ['snackbar-success'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      this.snackBar.open(`Error in unarchiving registration.\nPlease try again and/or contact support if problem persists`, '', {
        panelClass: ['snackbar-error'],
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }


  openEditDialog($event, regnRecord) {
    $event.stopPropagation();
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      regnRecord,
    };
    this.dialog.open(EditRegistrationDialogComponent, dialogConfig);
  }

  expandRow(element: any) {
    this.expandedElement = this.expandedElement?.id === element.id ? null : element;
  }

  applyExpandedClass(element: any) {
    return this.expandedElement?.id === element.id;
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
    this.archivedRegnsSubscription?.unsubscribe();
    this.unArchivedRegnsSubscription?.unsubscribe();
  }

  downloadAsCSV(type: string) {
    const filename = `${type} ${moment(this.selectedDate).format('YYYY-MM-DD')}`;
    if (!this.regnsRawData || (this.regnsRawData.length === 0)) {
      return;
    }
    const csvData = this.ConvertToCSV(this.regnsRawData, this.columns.filter(column => column.showHeader).map(column => column.name));
    const blob = new Blob(['\ufeff' + csvData], {type: 'text/csv;charset=utf-8;'});
    const dwldLink = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
      dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute('href', url);
    dwldLink.setAttribute('download', filename + ".csv");
    dwldLink.style.visibility = 'hidden';
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
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

}
