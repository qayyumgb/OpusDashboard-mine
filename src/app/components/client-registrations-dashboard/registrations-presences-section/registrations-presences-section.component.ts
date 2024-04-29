import {AfterViewInit, Component, Injectable, OnDestroy, ViewChild} from '@angular/core';
import {ActivitySession, Column} from '../../../common/interfaces/new-table-interfaces';
import {MatTableDataSource} from '@angular/material/table';
import {RegistrationMainAttributes} from '../../../common/interfaces/clock-interfaces';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../services/auth.service';
import {FirestoreService} from '../../../services/firestore.service';
import {Router} from '@angular/router';
import {ClientInContextService} from '../../../services/client-in-context.service';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import * as moment from 'moment/moment';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TIME_FORMAT, TIME_ZONE} from '../../../common/utils/time-utils';
import momentDurationFormatSetup from 'moment-duration-format';
import {EditPresenceDialogComponent} from './edit-presence-dialog/edit-presence-dialog.component';
import {
  MatDatepickerModule,
  MatDateRangeSelectionStrategy,
  DateRange,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatDateRangePicker,
} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {DateAdapter} from '@angular/material/core';
import {FormControl, FormGroup} from '@angular/forms';
import {CreateLabelDialogComponent} from '../../client-labels/create-label-dialog/create-label-dialog.component';
import {CreatePresenceDialogComponent} from './create-presence-dialog/create-presence-dialog.component';

momentDurationFormatSetup(moment);

@Injectable()
export class SelectionStrategy<D> implements MatDateRangeSelectionStrategy<D> {
  constructor(private dateAdapter: DateAdapter<D>) {
  }

  selectionFinished(date: D | null): DateRange<D> {
    return this._createWeekRange(date);
  }

  createPreview(activeDate: D | null): DateRange<D> {
    return this._createWeekRange(activeDate);
  }

  private _createWeekRange(date: D | null): DateRange<D> {
    if (date) {
      // const a = mondayToFriday(date)
      const dayOfWeek = this.dateAdapter.getDayOfWeek(date);
      const dayOfWeekOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const start = this.dateAdapter.addCalendarDays(
        date,
        -0 - dayOfWeekOffset
      );
      const end = this.dateAdapter.addCalendarDays(date, 6 - dayOfWeekOffset);
      return new DateRange<D>(start, end);
    }

    return new DateRange<D>(null, null);
  }
}

@Component({
  selector: 'app-registrations-presences-section',
  templateUrl: './registrations-presences-section.component.html',
  styleUrls: ['./registrations-presences-section.component.scss',
    '../../../common/styles/listing.scss'],
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
  providers: [
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
      useClass: SelectionStrategy,
    },
  ],
})
export class RegistrationsPresencesSectionComponent implements AfterViewInit, OnDestroy {
  today = new Date();
  day = this.today.getDate();
  month = this.today.getMonth();
  year = this.today.getFullYear();
  weekNumber = 0;
  weekSelected: any;
  dateRange: FormGroup;
  quickControl = new FormControl('WEEK');

  @ViewChild('picker') picker: MatDateRangePicker<Date>;


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
      footerValue: 'Total',
    },
    {
      name: 'workerGroupName',
      displayName: 'Group',
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
      name: 'daysWorked',
      displayName: 'Days worked',
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
      name: 'hoursWorked',
      displayName: 'Hours worked',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: 'sumDurations',
      footerValue: '',
    },
    {
      name: 'breakHoursPaid',
      displayName: 'Break hours paid',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: true,
      footerType: 'sumDurations',
      footerValue: '',
    },
    {
      name: 'breakHoursUnpaid',
      displayName: 'Break hours unpaid',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: false,
      footerType: 'sumDurations',
      footerValue: '',
    },
    /*{
      name: 'sickHours',
      displayName: 'Sick hours',
      showHeader: true,
      showHeaderFilter: true,
      showTopFilter: false,
      filterValue: '',
      filterOptions: [],
      filtered: false,
      showInFooter: false,
      footerType: null,//change to 'sumDurations' - when sick hours is implemented
      footerValue: '',
    },*/
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

  columnsHeadersToDisplayNested: string[] = [
    'date',
    'startTime',
    'endTime',
    'hoursWorked',
    'breakHoursPaid',
    'breakHoursUnpaid',
    //'sickHours',
    'edit'
  ];

  workerNestedAttributesReadableMap: Map<string, string> = new Map([
    ['date', 'Date'],
    ['startTime', 'Start time'],
    ['endTime', 'End time'],
    ['hoursWorked', 'Hours worked'],
    ['breakHoursPaid', 'Break hours paid'],
    ['breakHoursUnpaid', 'Break hours unpaid'],
    //['sickHours', 'Sick hours'],
    ['edit', ' ']
  ]);

  columnsToDisplayNested: string[] = [
    'date',
    'startTime',
    'endTime',
    'hoursWorked',
    'breakHoursPaid',
    'breakHoursUnpaid',
    //'sickHours',
    'edit'
  ];

  columnHeaderToColumnMapWeeklyOverview: Map<string, string> = new Map([
    ['workerName', 'Worker'],
    ['sickHours', 'Sick'],
    ['monday', 'Monday'],
    ['tuesday', 'Tuesday'],
    ['wednesday', 'Wednesday'],
    ['thursday', 'Thursday'],
    ['friday', 'Friday'],
    ['saturday', 'Saturday'],
    ['sunday', 'Sunday'],
    ['allHoursPaid', 'Total'],
  ]);

  columnHeaderToColumnMapDailyOverview: Map<string, string> = new Map([
    ['workerName', 'Worker'],
    ['date', 'Date'],
    ['day', 'Day'],
    ['startTime', 'Start'],
    ['endTime', 'End'],
    ['breakHoursPaid', 'Breaks paid'],
    ['breakHoursUnpaid', 'Breaks unpaid'],
    ['sickHours', 'Sick'],
    ['allHoursPaid', 'Total'],
  ]);

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dateInContextSubscription: Subscription;
  selectedDate: Date = new Date();
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unArchivedRegnsSubscription: Subscription;
  presencesSubscription: Subscription;
  presencesRawData: any[];
  filterString: string;
  expandedElement: any = null;
  usedStartDate: object;
  isArchivedShown = false;
  tableData: any[];
  workerTotalsMap: Map<any, any>;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              private dateAdapter: DateAdapter<Date>) {
    this.weekNumber = moment().isoWeek();
    const fromDate = moment().startOf('isoWeek').toDate();
    const toDate = moment().endOf('isoWeek').toDate();
    this.dateRange = new FormGroup({
      start: new FormControl(fromDate),
      end: new FormControl(toDate),
    });
    this.dateAdapter.setLocale('nl');
    this.dateAdapter.getFirstDayOfWeek = () => {
      return 1;
    };
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      this.fetchPresencesForClient(this.isArchivedShown, new Date());
    });
  }

  ngAfterViewInit() {
    this.dateRange.valueChanges.subscribe(value => {
      if (this.usedStartDate === value.start) {
        //console.log('returned');
        return;
      }
      //console.log('went through');
      this.weekNumber = moment(value.start).isoWeek();
      this.usedStartDate = value.start;
      this.fetchPresencesForClient(this.isArchivedShown, moment(value.start).toDate());
      //console.log(value);
      //console.log(moment(value.start).toDate());
    });
  }

  getDisplayedCols() {
    return [...this.displayedColumns];
  }


  fetchPresencesForClient(isArchived: boolean, selectedDate: Date) {
    this.presencesSubscription?.unsubscribe();
    this.presencesSubscription =
      this.firestoreService
        .getPresencesForClientId(this.selectedClientDocData.id, selectedDate, isArchived)
        .subscribe((presences: any[]) => {
          this.tableData = [];
          //presences = presences.filter(presence => presence.deviceType === 'CLOCKWEB' || presence.deviceType === 'CLOCK');
          this.presencesRawData = presences;
          this.tableData = this.mapFirestoreDataToTableData(presences);

          this.tableData.sort((n1, n2) => {
            return +n1.workerName > +n2.workerName ? -1 : +n1.workerName < +n2.workerName ? 1 : 0;
          });

          this.dataSource = new MatTableDataSource(this.tableData);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.setUpFiltering();
        });
  }

  mapFirestoreDataToTableData(presences: any[]) {
    const workerTableData = [];
    const workerPrecensesMap = new Map();
    this.workerTotalsMap = new Map();
    for (const presence of presences) {
      if (presence.workerId) {
        let workerSpecificList = workerPrecensesMap.get(presence.workerId);
        if (!workerSpecificList) {
          workerSpecificList = []
        }
        workerSpecificList.push(presence);
        workerPrecensesMap.set(presence.workerId, workerSpecificList);

        let workerSpecificTotalsObj: any = this.workerTotalsMap.get(presence.workerId);
        if (!workerSpecificTotalsObj) {
          workerSpecificTotalsObj = {
            totalHoursWorked: 0,
            totalBreakHoursPaid: 0,
            totalBreakHoursUnpaid: 0
          };
        }
        workerSpecificTotalsObj.totalHoursWorked += presence.durationTasks ? presence.durationTasks : 0;
        workerSpecificTotalsObj.totalBreakHoursPaid += presence.durationBreaksPaid ? presence.durationBreaksPaid : 0;
        workerSpecificTotalsObj.totalBreakHoursUnpaid += presence.durationBreaksUnpaid ? presence.durationBreaksUnpaid : 0;
        this.workerTotalsMap.set(presence.workerId, workerSpecificTotalsObj);
      }
    }
    for (const workerId of workerPrecensesMap.keys()) {
      let workerSpecificPresencesList = workerPrecensesMap.get(workerId);
      const workerRecord: any = {
        workerId,
        workerName: workerSpecificPresencesList[0].workerName,
        workerGroupName: workerSpecificPresencesList[0].workerGroupName ?? '',
        daysWorked: workerSpecificPresencesList.length
      }
      workerSpecificPresencesList = workerSpecificPresencesList.map(presence => {
        return {
          dateToCompare: moment(presence.startTimestamp.toDate()).tz(TIME_ZONE).format('YYYY-MM-DD'),
          ...presence
        }
      });
      const workerTotalsObj = this.workerTotalsMap.get(workerId);
      workerRecord.sickHours = '-';
      workerRecord.nestedRows = this.setUpWeekListForWorker(workerSpecificPresencesList);
      workerRecord.hoursWorked = workerTotalsObj.totalHoursWorked ? moment.duration(workerTotalsObj.totalHoursWorked, 'seconds').format(TIME_FORMAT) : '0:00';
      workerRecord.breakHoursPaid = workerTotalsObj.totalBreakHoursPaid ? moment.duration(workerTotalsObj.totalBreakHoursPaid, 'seconds').format(TIME_FORMAT) : '0:00';
      workerRecord.breakHoursUnpaid = workerTotalsObj.totalBreakHoursUnpaid ? moment.duration(workerTotalsObj.totalBreakHoursUnpaid, 'seconds').format(TIME_FORMAT) : '0:00';
      workerTableData.push(workerRecord);
    }
    return workerTableData;
  }

  buildNestedDataArrayForWorker(workerSpecificPresenceList) {
    const dayWiseListForWorker = [];
    for (const presence of workerSpecificPresenceList) {
      dayWiseListForWorker.push({})
    }
    return dayWiseListForWorker;
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
      if (footerType === 'sumDurations') {
        column.footerValue = filteredDatasource.reduce(
          (accumulator, currentValue) => {
            const accumulatedValue = moment.duration(accumulator).as('seconds') + (currentValue ? moment.duration(currentValue).as('seconds') : 0);
            return moment.duration(accumulatedValue, 'seconds').format(TIME_FORMAT);
          }, 0);
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

  openEditDialog($event, presenceRecord) {
    $event.stopPropagation();
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      presenceRecord,
    };
    this.dialog.open(EditPresenceDialogComponent, dialogConfig);
  }

  expandRow(element: any) {
    this.expandedElement = this.expandedElement?.workerId === element.workerId ? null : element;
  }

  applyExpandedClass(element: any) {
    return this.expandedElement?.workerId === element.workerId;
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
    this.presencesSubscription?.unsubscribe();
    this.unArchivedRegnsSubscription?.unsubscribe();
  }

  setUpWeekListForWorker(presenceListForWorker) {
    let count = 0;
    const workerSpecificList = [];
    const startOfWeekMoment = moment(this.dateRange.value.start).startOf('isoWeek');//It's actually Sunday in moment, while our week starts from Monday
    const toTimestamp = moment().tz(TIME_ZONE).endOf('week').add(1, 'day').toDate();
    while (count < 7) {
      const dateStr = startOfWeekMoment.clone().add(count, 'day').format('YYYY-MM-DD');
      const presenceObjForDateStr = presenceListForWorker.filter(presence => presence.dateToCompare === dateStr)[0] ?? null;
      let hoursWorkedStr = '-';
      let breakHoursPaidStr = '-';
      let breakHoursUnpaidStr = '-';
      if (presenceObjForDateStr) {
        hoursWorkedStr = !presenceObjForDateStr?.durationTasks ? '0:00' : moment.duration(presenceObjForDateStr.durationTasks, 'seconds').format(TIME_FORMAT);
        breakHoursPaidStr = !presenceObjForDateStr?.durationBreaksPaid ? '0:00' : moment.duration(presenceObjForDateStr.durationBreaksPaid, 'seconds').format(TIME_FORMAT);
        breakHoursUnpaidStr = !presenceObjForDateStr?.durationBreaksUnpaid ? '0:00' : moment.duration(presenceObjForDateStr.durationBreaksUnpaid, 'seconds').format(TIME_FORMAT);
      }
      workerSpecificList.push({
        presenceDoc: presenceObjForDateStr ?? null,
        date: startOfWeekMoment.clone().add(count, 'day').format('dddd D MMM'),
        startTime: presenceObjForDateStr ? presenceObjForDateStr.startTimestamp ? moment(presenceObjForDateStr.startTimestamp.toMillis()).format('HH:mm') : '-' : '-',
        endTime: presenceObjForDateStr ? presenceObjForDateStr.endTimestamp ? moment(presenceObjForDateStr.endTimestamp.toMillis()).format('HH:mm') : '-' : '-',
        hoursWorked: hoursWorkedStr,
        breakHoursPaid: breakHoursPaidStr,
        breakHoursUnpaid: breakHoursUnpaidStr,
        sickHours: '-'
      });
      count++;
    }
    return workerSpecificList;
  }

  toggleArchived(isArchivedSelected: boolean) {
    this.isArchivedShown = isArchivedSelected;
    if (!isArchivedSelected) {
      this.fetchPresencesForClient(false, moment(this.dateRange.controls.start.value).toDate());
    } else {
      this.fetchPresencesForClient(true, moment(this.dateRange.controls.start.value).toDate());
    }
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = {};
    this.dialog.open(CreatePresenceDialogComponent, dialogConfig);
  }

  exportCSV(option: string) {
    const startDateMoment = moment(this.dateRange.controls.start.value);
    const endDateMoment = moment(this.dateRange.controls.end.value);
    let fileName: string;
    let columns: string[];
    let headerNames: string[];
    let title: string;
    let dataToExport: any;
    const groupName = this.filterDictionary.get('workerGroupName') ? this.filterDictionary.get('workerGroupName') : 'all';
    switch (option) {
      case 'WEEK_OVERVIEW_WITHOUT_TITLE':
        fileName = `week_overview_${startDateMoment.format('YYYY')}-${this.weekNumber}_${groupName}_${moment().format('YYYY-MM-DD_HH-mm')}`;
        columns = ['workerName', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'allHoursPaid', /*'sickHours'*/];
        dataToExport = this.mapTableDataToWeeklyOverViewCSVExport();
        headerNames = columns.map(column => this.columnHeaderToColumnMapWeeklyOverview.get(column));
        this.downloadAsCSV(dataToExport, fileName, columns, [], headerNames, title, false);
        break;
      case 'WEEK_OVERVIEW_WITH_TITLE':
        fileName = `week_overview_${startDateMoment.format('YYYY')}-${this.weekNumber}_${groupName}_${moment().format('YYYY-MM-DD_HH-mm')}`;
        columns = ['workerName', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'allHoursPaid', /*'sickHours'*/];
        title = `${this.weekNumber} (${startDateMoment.format('YYYYMMDD')} - ${endDateMoment.format('YYYYMMDD')}) ${groupName} - ${moment().format('YYYY-MM-DD_HH:mm')}`;
        headerNames = columns.map(column => this.columnHeaderToColumnMapWeeklyOverview.get(column));
        dataToExport = this.mapTableDataToWeeklyOverViewCSVExport();
        this.downloadAsCSV(dataToExport, fileName, columns, [], headerNames, title, true);
        break;
      case 'DAILY_OVERVIEW_WITHOUT_TITLE':
        fileName = `daily_overview_${startDateMoment.format('YYYY')}-${this.weekNumber}_${groupName}_${moment().format('YYYY-MM-DD_HH-mm')}`;
        columns = ['date', 'day', 'workerName', 'startTime', 'endTime', 'allHoursPaid','breakHoursPaid', 'breakHoursUnpaid', /*'sickHours'*/];
        dataToExport = this.mapTableDataToDailyOverViewCSVExport();
        headerNames = columns.map(column => this.columnHeaderToColumnMapDailyOverview.get(column));
        this.downloadAsCSV(dataToExport, fileName, columns, [], headerNames, title, false);
        break;
      case 'DAILY_OVERVIEW_WITH_TITLE':
        fileName = `daily_overview_${startDateMoment.format('YYYY')}-${this.weekNumber}_${groupName}_${moment().format('YYYY-MM-DD_HH-mm')}`;
        columns = ['date', 'day', 'workerName', 'startTime', 'endTime', 'allHoursPaid','breakHoursPaid', 'breakHoursUnpaid', /*'sickHours'*/];
        title = `${this.weekNumber} (${startDateMoment.format('YYYYMMDD')} - ${endDateMoment.format('YYYYMMDD')}) ${groupName} - ${moment().format('YYYY-MM-DD_HH:mm')}`;
        dataToExport = this.mapTableDataToDailyOverViewCSVExport();
        headerNames = columns.map(column => this.columnHeaderToColumnMapDailyOverview.get(column));
        this.downloadAsCSV(dataToExport, fileName, columns, [], headerNames, title, true);
        break;
    }
  }

  downloadAsCSV(dataToExport: any, filename: string, columns: string[], dateColumns: string[], headers: string[], title: string, isTitled = false) {
    // if (!this.sessionsData || (this.sessionsData.length === 0)) {
    //   return;
    // }
    const csvData = this.ConvertToCSV(dataToExport, columns, dateColumns, headers, title, isTitled);
    const blob = new Blob(['\ufeff' + csvData], {type: 'text/csv;charset=utf-8;'});
    const dwldLink = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
      dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", filename + ".csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  ConvertToCSV(objArray, headerList, dateColumns, headerNames, title, isTitled) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = '';

    if (isTitled) {
      str += title + '\r\n';
    }
    for (const header of headerNames) {
      row += header + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const [counter, header] of headerList.entries()) {
        if (['netPerformance', 'grossPerformance', 'amountPicked'].includes(header)) {
          line += ((array[i][header] ? (+array[i][header]).toFixed(0) : null) ?? '');
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

  mapTableDataToWeeklyOverViewCSVExport() {
    const mappedList: string[] = [];
    this.tableData.map(mainRow => {
      const csvRow: any = {};
      csvRow.workerName = mainRow.workerName;
      const workerTotalsObj = this.workerTotalsMap.get(mainRow.workerId);
      let allHoursPaidCount = workerTotalsObj.totalHoursWorked ?? 0;
      allHoursPaidCount += workerTotalsObj.totalBreakHoursPaid ?? 0;
      csvRow.allHoursPaid = allHoursPaidCount > 0 ? moment.duration(allHoursPaidCount, 'seconds').format(TIME_FORMAT) : '0:00';
      csvRow.sickHours = '-';//not implemented yet
      let dayCount = 0;
      mainRow.nestedRows.map(nestedRow => {
        let totalPaidHoursHHmm = '00:00';
        if (nestedRow.presenceDoc) {
          let totalPaidHours = nestedRow.presenceDoc.durationTasks ? nestedRow.presenceDoc.durationTasks : 0;
          totalPaidHours += nestedRow.presenceDoc.durationBreaksPaid ? nestedRow.presenceDoc.durationBreaksPaid : 0;
          totalPaidHoursHHmm = totalPaidHours > 0 ? moment.duration(totalPaidHours, 'seconds').format(TIME_FORMAT) : '0:00';
        }
        switch (dayCount) {
          case 0:
            csvRow.monday = totalPaidHoursHHmm;
            break;
          case 1:
            csvRow.tuesday = totalPaidHoursHHmm;
            break;
          case 2:
            csvRow.wednesday = totalPaidHoursHHmm;
            break;
          case 3:
            csvRow.thursday = totalPaidHoursHHmm;
            break;
          case 4:
            csvRow.friday = totalPaidHoursHHmm;
            break;
          case 5:
            csvRow.saturday = totalPaidHoursHHmm;
            break;
          case 6:
            csvRow.sunday = totalPaidHoursHHmm;
            break;
        }
        dayCount++;
      });
      mappedList.push(csvRow);
    });
    return mappedList;
  }

  mapTableDataToDailyOverViewCSVExport() {
    const mappedList: string[] = [];
    this.tableData.map(mainRow => {

      const workerName = mainRow.workerName;
      const workerTotalsObj = this.workerTotalsMap.get(mainRow.workerId);
      let allHoursPaidCount = workerTotalsObj.totalHoursWorked ?? 0;
      allHoursPaidCount += workerTotalsObj.totalBreakHoursPaid ?? 0;

      const sickHours = '-';//not implemented yet
      mainRow.nestedRows.map(nestedRow => {
        const csvRow: any = {};

        csvRow.workerName = workerName;
        csvRow.sickHours = sickHours;
        let totalPaidHoursHHmm = '00:00';
        if (nestedRow.presenceDoc) {
          let totalPaidHours = nestedRow.presenceDoc.durationTasks ? nestedRow.presenceDoc.durationTasks : 0;
          totalPaidHours += nestedRow.presenceDoc.durationBreaksPaid ? nestedRow.presenceDoc.durationBreaksPaid : 0;
          totalPaidHoursHHmm = totalPaidHours > 0 ? moment.duration(totalPaidHours, 'seconds').format(TIME_FORMAT) : '0:00';
        }
        csvRow.date = moment(nestedRow.date, 'dddd D MMM').format('YYYY-MM-DD');
        csvRow.day = moment(nestedRow.date, 'dddd D MMM').format('dddd');
        csvRow.startTime = nestedRow.startTime;
        csvRow.endTime = nestedRow.endTime;
        csvRow.breakHoursUnpaid = nestedRow.breakHoursUnpaid ?? '-';
        csvRow.breakHoursPaid = nestedRow.breakHoursPaid ?? '-';
        csvRow.allHoursPaid = totalPaidHoursHHmm;
        csvRow.sickHours = mainRow.sickHours ?? '-';
        mappedList.push(csvRow);
      });
    });
    return mappedList;
  }


}
