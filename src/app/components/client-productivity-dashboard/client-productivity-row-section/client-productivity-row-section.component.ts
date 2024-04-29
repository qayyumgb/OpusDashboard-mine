import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from "@angular/material-moment-adapter";
import {EUROPEAN_DATE_FORMATS} from "../../../common/utils/date-utils";
import {Subscription} from "rxjs";
import {MatTableDataSource} from "@angular/material/table";
import {ClientMainAttributes} from "../../../common/interfaces/client-interfaces";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {AuthService} from "../../../services/auth.service";
import {FirestoreService} from "../../../services/firestore.service";
import {Router} from "@angular/router";
import {ClientInContextService} from "../../../services/client-in-context.service";
import * as moment from "moment/moment";

interface ChartSerie {
  name: string;
  value: number;
}

interface ChartRow {
  name: string;
  series: ChartSerie[];
}


@Component({
  selector: 'app-client-productivity-row-section',
  templateUrl: './client-productivity-row-section.component.html',
  styleUrls: ['./client-productivity-row-section.component.scss',
    '../../../common/styles/listing.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {provide: MAT_DATE_FORMATS, useValue: EUROPEAN_DATE_FORMATS}
  ]
})
export class ClientProductivityRowSectionComponent implements OnInit, OnDestroy {

  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;

  dateToday: Date = new Date();
  selectedDate: Date;
  chartAnimation = true;
  rowSortOption = 'HL';
  rowChartVsTable = 'chart';
  prdctvtyRowData: any[] = [];

  countData = {
    totalAll: {
      count: 0,
      rows: 0
    },
    finished: {
      count: 0,
      rows: 0
    }
  }

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  legendTitle = '';
  showXAxisLabel = true;
  yAxisLabel = 'Row';
  showYAxisLabel = true;
  xAxisLabel = 'Count';
  showDataLabel = true;
  roundDomains = true;
  completeDataMap = new Map();
  rowTableDataMap = new Map();

  graphHeight: number;

  colorScheme = {
    domain: [
      '#00ccb3',
      '#d81159',
      '#e45932',
      '#efa00b',
      '#00aebf',
      '#00e9a7',
      '#13a384',
      '#265c60',
    ]
  };

  prdctvtyAttributesReadableMap: Map<string, string> = new Map([
    ['rowNumber', 'Row Number'],
    ['varietyName', 'Variety'],
    ['amountPicked', 'Amount Picked'],
    ['workers', 'Workers'],
    ['trolleyNumbers', 'Trolley Numbers'],
    ['time', 'Time']
  ]);

  rowsColumnsToDisplay: string[] = [
    'rowNumber',
    'varietyName',
    'amountPicked',
    'workers',
    'trolleyNumbers',
    'time'
  ];
  columnsHeadersToDisplay: string[] = [
    'rowNumber',
    'varietyName',
    'amountPicked',
    'workers',
    'trolleyNumbers',
    'time'
  ];
  rowsDataSource: MatTableDataSource<ClientMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  dateInContextSubscription: Subscription;
  sessionsDataSubscription: Subscription;
  clientLocInContextServiceSubscription: Subscription;
  selectedLocationId: string;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
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
          this.clientLocInContextServiceSubscription = this.clientInContextService.clientLocSubject.subscribe(selectedLocation => {
            this.selectedLocationId = !selectedLocation || (selectedLocation?.id === '-1') ? null : selectedLocation?.id;
            this.loadChart();
          });
        });
      });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
    this.sessionsDataSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientLocInContextServiceSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }

  onSelect(event) {
    //console.log(event);
  }

  getToolTip(model) {
    const filteredRowSection = this.completeDataMap
      .get(model.series)
      .filter(chartSection => chartSection.rowNumber === model.series && chartSection.count === model.value)[0];
    return `<div style="font-weight: 600;text-align: center;margin-bottom: 0;">${filteredRowSection?.workerName ?? 'NA'}</div>
                Variety: ${filteredRowSection.varietyName ?? 'NA'}<br/>
                Picked: ${model.value}<br/>
                Trolley: ${filteredRowSection?.trolleyId ?? 'NA'} <br/>
                Time: ${filteredRowSection?.startTimestamp ? moment(filteredRowSection?.startTimestamp?.toMillis()).format('HH:mm') : ''}
                 - ${filteredRowSection?.endTimestamp ? moment(filteredRowSection?.endTimestamp?.toMillis()).format('HH:mm') : ''} <br/>`
  }

  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  onDateChange() {
    this.clientInContextService.dateInContextSubject.next(this.selectedDate);
  }

  loadChart() {
    const dateToQuery = moment(this.selectedDate).format('YYYY-MM-DD');
    this.prdctvtyRowData = [];
    this.sessionsDataSubscription?.unsubscribe();
    this.sessionsDataSubscription = this.firestoreService.getUnarchivedSessions(this.selectedClientDocData.id, dateToQuery, this.selectedLocationId ?? null)
      .subscribe(sessionsData => {
        if (!sessionsData) {
          return;
        }

        const tempRowSet = new Set()
        for (const session of sessionsData) {
          tempRowSet.add(session.rowId);
        }
        console.log('tempRowSet size:' + tempRowSet.size);

        sessionsData = sessionsData.filter(session => session.rowId !== null && session.rowId !== '');

        this.rowTableDataMap = new Map();
        const uniqueRows = Array.from(tempRowSet);/*sessionsData
        .map((value) => value.rowNumber)
        .filter(
          (value: any, index: any, array: string | any[]) =>
            array.indexOf(value) === index
        );*/

        this.graphHeight = 90 + (50 * uniqueRows.length);
        let totalCount = 0;
        let finishedCount = 0;
        const finishedRowsSet = new Set();
        let latestChartData = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < uniqueRows.length; i++) {
          const rowId = uniqueRows[i];
          let varietySessions = sessionsData.filter((v) => v.rowId === rowId);
          const rowNumber = varietySessions[0].rowNumber;

          if (this.selectedClientDocData.correctionFactor) {
            varietySessions = varietySessions.map(varietySession => {
              const isOriginal = varietySession.hasOwnProperty('isOriginal') ? varietySession.isOriginal : true;
              if (varietySession.count && isOriginal && !varietySession.isManual) {
                varietySession.count = +(varietySession.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
              }
              return varietySession;
            });
          }

          const chartRow: ChartRow = {
            name: rowNumber as string,
            series: []
          };

          this.completeDataMap.set(chartRow.name, varietySessions);

          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < varietySessions.length; j++) {
            const varietyActivity = varietySessions[j];

            const varietyActivityCount = varietyActivity.count;

            totalCount += varietyActivityCount ?? 0;
            if (varietyActivity.endTimestamp) {
              finishedCount += varietyActivityCount ?? 0;
              finishedRowsSet.add(uniqueRows[i]);
            } else if (varietyActivity.startTimestamp) {
              const sessionStartTime = varietyActivity.startTimestamp;
              const olderThan2Hours = moment(sessionStartTime.toDate()).isBefore(moment().subtract(2, 'hours'));
              if (olderThan2Hours) {
                finishedCount += varietyActivityCount ?? 0;
                finishedRowsSet.add(varietyActivity.rowId);
              }
            }
            chartRow.series.push({
              name: varietyActivity.workerName,
              value: varietyActivityCount ?? 0,
            });
          }
          latestChartData.push(chartRow);
        }

        this.countData = {
          totalAll: {
            count: totalCount,
            rows: uniqueRows.length
          },
          finished: {
            count: finishedCount,
            rows: finishedRowsSet.size
          },
        }

        latestChartData = latestChartData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 > n2 ? -1 : n1 < n2 ? 1 : 0;
        });


        const latestRowTableData = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < uniqueRows.length; i++) {

          const rowId = uniqueRows[i];
          const varietySessions = sessionsData.filter((v) => v.rowId === rowId);
          const rowNumber = varietySessions[0].rowNumber;


          const rowActivities = sessionsData.filter((v) => v.rowNumber === rowNumber);


          let tableRow: any;

          if (this.rowTableDataMap.get(rowNumber)) {
            tableRow = this.rowTableDataMap.get(rowNumber);
          } else {
            tableRow = {
              rowNumber,
              amountPicked: 0,
              waste: 0,
              workers: [],
              trolleyNumbers: []
            };
          }
          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < rowActivities.length; j++) {
            const rowActivity = rowActivities[j];
            if (!tableRow.varietyName) {
              tableRow.varietyName = this.capitalizeFirstLetter(rowActivity.varietyName);
            }

            tableRow.amountPicked += rowActivity.count ?? 0;

            tableRow.waste = (rowActivity.waste ? tableRow.waste + rowActivity.waste : null);
            if (tableRow.workers && !tableRow.workers.includes(rowActivity.workerName)) {
              tableRow.workers.push(rowActivity.workerName);
            }
            if (tableRow.trolleyNumbers && !tableRow.trolleyNumbers.includes(rowActivity.trolleyId)) {
              tableRow.trolleyNumbers.push(rowActivity.trolleyId);
            }
          }
          if (rowActivities && rowActivities.length > 0) {
            tableRow.time = `${rowActivities[0]?.startTimestamp ? moment(rowActivities[0]?.startTimestamp?.toMillis()).format('HH:mm') : ''}
          - ${rowActivities[0]?.endTimestamp ? moment(rowActivities[0]?.endTimestamp?.toMillis()).format('HH:mm') : ''}`;
          }
          this.rowTableDataMap.set(rowNumber, tableRow);
        }

        this.rowTableDataMap.forEach((value, key) => {
          latestRowTableData.push(value);
        });

        Object.assign(this, {prdctvtyRowData: [...latestChartData]});

        latestRowTableData.sort((n1, n2) => {
          return +n1.rowNumber > +n2.rowNumber ? 1 : +n1.rowNumber < +n2.rowNumber ? -1 : 0;
        });

        this.rowsDataSource = new MatTableDataSource(latestRowTableData);
        this.rowsDataSource.paginator = this.paginator;
        this.rowsDataSource.sort = this.sort;
      });
  }

  isRowChartDisplayed() {
    return (this.rowChartVsTable === 'chart' ? 'block' : 'none');
  }

  isRowTableDisplayed() {
    return (this.rowChartVsTable === 'table' && (this.prdctvtyRowData.length > 0) ? 'block' : 'none');
  }

  downloadAsCSV(type) {
    const filename = `${type} ${moment().format('YYYY-MM-DD HHmmss')}`;
    if (!this.rowsDataSource || !this.rowsDataSource.data || (this.rowsDataSource.data.length === 0)) {
      return;
    }
    const csvData = this.ConvertToCSV(this.rowsDataSource.data, this.rowsColumnsToDisplay);
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

  ConvertToCSV(objArray, headerList) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = '';

    for (const header of headerList) {
      row += this.prdctvtyAttributesReadableMap.get(header) + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const [counter, header] of headerList.entries()) {
        if (['amountPicked'].includes(header)) {
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

  rowSortOptionChanged() {
    if (!this.prdctvtyRowData || (this.prdctvtyRowData.length === 0)) {
      return;
    }
    let sortedChartData;
    switch (this.rowSortOption) {
      case 'AZ':
        sortedChartData = this.prdctvtyRowData.sort((charRowA: any, chartRowB: any) => {
          return +charRowA.name < +chartRowB.name ? -1 : +charRowA.name > +chartRowB.name ? 1 : 0;
        });
        break;
      case 'ZA':
        sortedChartData = this.prdctvtyRowData.sort((charRowA: any, chartRowB: any) => {
          return +charRowA.name > +chartRowB.name ? -1 : +charRowA.name < +chartRowB.name ? 1 : 0;
        });
        break;
      case 'HL':
        sortedChartData = this.prdctvtyRowData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 > n2 ? -1 : n1 < n2 ? 1 : 0;
        });
        break;
      case 'LH':
        sortedChartData = this.prdctvtyRowData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 < n2 ? -1 : n1 > n2 ? 1 : 0;
        });
        break;
    }
    Object.assign(this, {prdctvtyRowData: [...sortedChartData]});
  }

}
