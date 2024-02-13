import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from "@angular/material/core";
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from "@angular/material-moment-adapter";
import {EUROPEAN_DATE_FORMATS} from "../../../common/utils/date-utils";
import {MatTableDataSource} from "@angular/material/table";
import {ClientMainAttributes} from "../../../common/interfaces/client-interfaces";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {Subscription} from "rxjs";
import {AuthService} from "../../../services/auth.service";
import {FirestoreService} from "../../../services/firestore.service";
import {ActivatedRoute, Router} from "@angular/router";
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
  selector: 'app-labor-productivity-section',
  templateUrl: './labor-productivity-section.component.html',
  styleUrls: ['./labor-productivity-section.component.scss',
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
export class LaborProductivitySectionComponent implements OnInit, OnDestroy {
  //view: any[] = [700, 400];
  laborPrdctvtyChartVsTable = 'chart';
  laborPrdctvtySortOption = 'AZ';
  dateToday: Date = new Date();
  selectedDate: Date;
  chartAnimation = true;

  laborPrdctvtyData: any[] = [];

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  legendTitle = '';
  showXAxisLabel = true;
  yAxisLabel = 'Worker';
  showYAxisLabel = true;
  xAxisLabel = 'Count';
  showDataLabel = true;
  roundDomains = true;

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

  laborPrdctvtyAttributesReadableMap: Map<string, string> = new Map([
    ['workerName', 'Worker'],
    ['amountPicked', 'Amount Picked'],
    ['rowNumber', 'Row Number'],
    ['varietyName', 'Variety'],
    ['workingTime', 'Working Time'],
    ['time', 'Time']
  ]);

  laborPrdctvtyColumnsToDisplay: string[] = [
    'workerName',
    'amountPicked',
    'rowNumber',
    'varietyName',
    'workingTime',
    'time'
  ];
  columnsHeadersToDisplay: string[] = [
    'workerName',
    'amountPicked',
    'rowNumber',
    'varietyName',
    'workingTime',
    'time'
  ];
  laborPrdctvtyDataSource: MatTableDataSource<ClientMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  completeDataMap = new Map();
  dateInContextSubscription: Subscription;
  SessionsDataSubscription: Subscription;
  laborPrdctvtyTableDataMap = new Map();
  finishedData = {
    total: {
      count: 0,
      rows: 0
    },
    actual: {
      count: 0,
      rows: 0
    }
  }

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService,
              public route: ActivatedRoute) {
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
          this.loadChart();
        });
      });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
    this.SessionsDataSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }

  onSelect(event) {
    console.log(event);
  }

  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getToolTip(model) {
    const filteredRowSection = this.completeDataMap
      .get(model.series)
      .filter(chartSection => chartSection.varietyName === model.name && chartSection.count === model.value)[0];
    return `<div style="font-weight: 600;text-align: center;">${model.name}</div>
                Picked: ${model.value}<br/>
                Row: ${filteredRowSection?.rowNumber} <br/>
                Trolley: ${filteredRowSection?.trolleyId ?? 'NA'} <br/>
                Time: ${filteredRowSection?.startTimestamp ? moment(filteredRowSection?.startTimestamp?.toMillis()).format('HH:mm') : ''}
                 - ${filteredRowSection?.endTimestamp ? moment(filteredRowSection?.endTimestamp?.toMillis()).format('HH:mm') : ''} <br/>`
  }

  loadChart() {
    const dateToQuery = moment(this.selectedDate).format('YYYY-MM-DD');
    this.laborPrdctvtyData = [];
    this.SessionsDataSubscription = this.firestoreService.getUnarchivedSessions(this.selectedClientDocData.id, dateToQuery).subscribe(sessionsData => {
        if (!sessionsData) {
          return;
        }

        sessionsData = sessionsData.filter(session => session.rowId !== null && session.rowId !== '');
        this.laborPrdctvtyTableDataMap = new Map();

        const uniqueWorkers = sessionsData
          .map((value) => value.workerName)
          .filter(
            (value: any, index: any, array: string | any[]) =>
              array.indexOf(value) === index
          );

        this.graphHeight = 90 + (50 * uniqueWorkers.length);
        let totalCount = 0;
        let actualCount = 0;
        const totalRowsSet = new Set();
        const actualRowsSet = new Set();
        let latestChartData = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < uniqueWorkers.length; i++) {
          const worker = uniqueWorkers[i];
          let workerSessions = sessionsData.filter((v) => v.workerName === worker);

          const chartRow: ChartRow = {
            name: this.capitalizeFirstLetter(worker),
            series: [],
          };

          if (this.selectedClientDocData.correctionFactor) {
            workerSessions = workerSessions.map(workerSession => {
              const isOriginal = workerSession.hasOwnProperty('isOriginal') ? workerSession.isOriginal : true;
              if (workerSession.count && isOriginal && !workerSession.isManual) {
                workerSession.count = +(workerSession.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
              }
              return workerSession;
            });
          }

          this.completeDataMap.set(chartRow.name, workerSessions);

          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < workerSessions.length; j++) {
            const workerActivity = workerSessions[j];

            const workerActivityCount = workerActivity.count;

            totalCount += workerActivityCount ?? 0;

            totalRowsSet.add(workerActivity.rowId);
            if (workerActivity.endTimestamp) {
              actualCount += workerActivityCount ?? 0;
              actualRowsSet.add(workerActivity.rowId);
            }

            chartRow.series.push({
              name: workerActivity.varietyName,
              value: workerActivityCount ?? 0,
            });
          }
          latestChartData.push(chartRow);
        }

        this.finishedData = {
          total: {
            count: totalCount,
            rows: totalRowsSet.size
          },
          actual: {
            count: actualCount,
            rows: actualRowsSet.size
          },
        }

        latestChartData = latestChartData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 > n2 ? -1 : n1 < n2 ? 1 : 0;
        });

        Object.assign(this, {laborPrdctvtyData: [...latestChartData]});

        const latestLaborPrdctvtyTableData = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < uniqueWorkers.length; i++) {
          const workerName = uniqueWorkers[i];
          const workerActivities = sessionsData.filter((v) => v.workerName === workerName);

          let totalWorkingTimeMillis = 0;

          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < workerActivities.length; j++) {
            const tableRow: any = {
              workerName: uniqueWorkers[i],
            };
            const workerActivity = workerActivities[j];

            if (!tableRow.varietyName) {
              tableRow.varietyName = this.capitalizeFirstLetter(workerActivity.varietyName);
            }

            tableRow.amountPicked = workerActivity.count;

            if (workerActivity.startTimestamp && workerActivity.endTimestamp) {
              totalWorkingTimeMillis = workerActivity?.endTimestamp?.toMillis() - workerActivity?.startTimestamp?.toMillis();
            }

            let workingTimeStr = '';
            if (totalWorkingTimeMillis) {
              const hours = moment.duration(totalWorkingTimeMillis).hours();
              const minutes = moment.duration(totalWorkingTimeMillis).minutes();
              workingTimeStr += `${hours}h `;
              workingTimeStr += `${minutes % 60}m`;
              tableRow.workingTime = workingTimeStr;
            }

            tableRow.time = `${workerActivity?.startTimestamp ? moment(workerActivity?.startTimestamp?.toMillis()).format('HH:mm') : ''}
                      - ${workerActivity?.endTimestamp ? moment(workerActivity?.endTimestamp?.toMillis()).format('HH:mm') : ''}`;

            tableRow.rowNumber = workerActivity.rowNumber;
            latestLaborPrdctvtyTableData.push(tableRow);
          }
        }

        latestLaborPrdctvtyTableData.sort((n1, n2) => {
          return n1.workerName < n2.workerName ? -1 : n1.workerName > n2.workerName ? 1 : 0;
        });
        this.laborPrdctvtyDataSource = new MatTableDataSource(latestLaborPrdctvtyTableData);
        this.laborPrdctvtyDataSource.paginator = this.paginator;
        this.laborPrdctvtyDataSource.sort = this.sort;
      }
    );
  }

  isPrdctvtyChartDisplayed() {
    return (this.laborPrdctvtyChartVsTable === 'chart' ? 'block' : 'none');
  }

  isPrdctvtyTableDisplayed() {
    return (this.laborPrdctvtyChartVsTable === 'table' && (this.laborPrdctvtyData.length > 0) ? 'block' : 'none');
  }


  downloadAsCSV(type) {
    const filename = `${type} ${moment().format('YYYY-MM-DD HHmmss')}`;
    if (!this.laborPrdctvtyDataSource || !this.laborPrdctvtyDataSource.data || (this.laborPrdctvtyDataSource.data.length === 0)) {
      return;
    }
    const csvData = this.ConvertToCSV(this.laborPrdctvtyDataSource.data, this.laborPrdctvtyColumnsToDisplay);
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
      if (header === 'workingTime') {
        row += 'Working Time' + ',';
      } else if (header === 'avgSpeed') {
        row += 'Average Speed' + ',';
      } else {
        row += this.laborPrdctvtyAttributesReadableMap.get(header) + ',';
      }
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const [counter, header] of headerList.entries()) {
        if (['amountPicked', 'avgSpeed'].includes(header)) {
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

  prdctvtySortOptionChanged() {
    if (!this.laborPrdctvtyData || (this.laborPrdctvtyData.length === 0)) {
      return;
    }
    console.log(this.laborPrdctvtySortOption);
    let sortedChartData;
    switch (this.laborPrdctvtySortOption) {
      case 'AZ':
        sortedChartData = this.laborPrdctvtyData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.name < chartRowB.name ? -1 : charRowA.name > chartRowB.name ? 1 : 0;
        });
        break;
      case 'ZA':
        sortedChartData = this.laborPrdctvtyData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.name > chartRowB.name ? -1 : charRowA.name < chartRowB.name ? 1 : 0;
        });
        break;
      case 'HL':
        sortedChartData = this.laborPrdctvtyData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 > n2 ? -1 : n1 < n2 ? 1 : 0;
        });
        break;
      case 'LH':
        sortedChartData = this.laborPrdctvtyData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 < n2 ? -1 : n1 > n2 ? 1 : 0;
        });
        break;
    }
    Object.assign(this, {laborPrdctvtyData: [...sortedChartData]});
  }

}
