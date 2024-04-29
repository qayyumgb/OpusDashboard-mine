import {Component, OnDestroy, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {ClientMainAttributes} from "../../../common/interfaces/client-interfaces";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort, MatSortable} from "@angular/material/sort";
import {Subscription} from "rxjs";
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
  selector: 'app-client-productivity-variety-section',
  templateUrl: './client-productivity-variety-section.component.html',
  styleUrls: ['./client-productivity-variety-section.component.scss',
    '../../../common/styles/listing.scss']
})
export class ClientProductivityVarietySectionComponent implements AfterViewInit, OnDestroy {

  dateToday: Date = new Date();
  selectedDate: Date;
  chartAnimation = true;
  varietySortOption = 'HL';

  varietyChartVsTable = 'chart';

  varietyData: any[] = [];

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  legendTitle = '';
  showXAxisLabel = true;
  yAxisLabel = 'Variety';//TODO
  showYAxisLabel = true;
  xAxisLabel = 'Count';
  showDataLabel = true;
  roundDomains = true;
  completeDataMap = new Map();
  varietyTableDataMap = new Map();
  finishedData = {
    totalAll: {
      count: 0,
      rows: 0
    },
    finished: {
      count: 0,
      rows: 0
    }
  }

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

  varietyAttributesReadableMap: Map<string, string> = new Map([
    ['varietyName', 'Variety'],
    ['rowNumber', 'Row Number'],
    ['amountPicked', 'Amount Picked'],
    //['waste', 'Waste'],
    ['workers', 'Workers'],
    ['trolleyNumbers', 'Trolley Numbers'],
    ['time', 'Time']
  ]);

  rowsColumnsToDisplay: string[] = [
    'varietyName',
    'rowNumber',
    'amountPicked',
    //'waste',
    'workers',
    'trolleyNumbers',
    'time'
  ];
  columnsHeadersToDisplay: string[] = [
    'varietyName',
    'rowNumber',
    'amountPicked',
    //'waste',
    'workers',
    'time'
  ];
  varietiesDataSource: MatTableDataSource<ClientMainAttributes>;
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
  }

  ngAfterViewInit(): void {
    this.dateInContextSubscription = this.clientInContextService.dateInContextSubject
      .subscribe(dateInContext => {
        if (!dateInContext) {
          const dateNow = new Date();
          this.selectedDate = dateNow;
          this.clientInContextService.dateInContextSubject.next(dateNow);
        } else {
          this.selectedDate = dateInContext;
        }
        this.varietyData = [];

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
    this.clientLocInContextServiceSubscription?.unsubscribe();
  }

  onSelect(event) {
    console.log(event);
  }

  getToolTip(model) {
    const filteredRowSection = this.completeDataMap
      .get(model.series)
      .filter(chartSection => chartSection.workerName === model.name && chartSection.count === model.value)[0];
    return `<div style="font-weight: 600;text-align: center;">${model.name}</div>
                Picked: ${model.value}<br/>
                Row: ${filteredRowSection?.rowNumber} <br/>
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
    this.varietyData = [];
    this.sessionsDataSubscription?.unsubscribe();
    this.sessionsDataSubscription = this.firestoreService.getUnarchivedSessions(this.selectedClientDocData.id, dateToQuery, this.selectedLocationId ?? null)
      .subscribe(sessionsData => {
        if (!sessionsData) {
          return;
        }

        sessionsData = sessionsData.filter(session => session.rowId !== null && session.rowId !== '');

        this.varietyTableDataMap = new Map();
        const uniqueVarieties = sessionsData
          .map((value) => value.varietyName)
          .filter(
            (value: any, index: any, array: string | any[]) =>
              array.indexOf(value) === index
          );

        this.graphHeight = 90 + (50 * uniqueVarieties.length);
        let totalCount = 0;
        let finishedCount = 0;
        const totalRowsSet = new Set();
        const finishedRowsSet = new Set();
        let latestChartData = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < uniqueVarieties.length; i++) {
          const variety = uniqueVarieties[i];
          const varietySessions = sessionsData.filter((v) => v.varietyName === variety);

          const chartRow: ChartRow = {
            name: this.capitalizeFirstLetter(variety),
            series: []
          };

          this.completeDataMap.set(chartRow.name, varietySessions);

          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < varietySessions.length; j++) {
            const varietySession = varietySessions[j];

            let varietyActivityCount = varietySession.count;
            const isOriginal = varietySession.hasOwnProperty('isOriginal') ? varietySession.isOriginal : true;
            if (this.selectedClientDocData.correctionFactor && varietySession.count && isOriginal && !varietySession.isManual) {
              varietyActivityCount = +(varietySession.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
            }

            totalCount += varietyActivityCount ?? 0;
            totalRowsSet.add(varietySession.rowId);
            if (varietySession.endTimestamp) {
              finishedCount += varietyActivityCount ?? 0;
              finishedRowsSet.add(varietySession.rowId);
            } else if (varietySession.startTimestamp) {
              const sessionStartTime = varietySession.startTimestamp;
              const olderThan2Hours = moment(sessionStartTime.toDate()).isBefore(moment().subtract(2, 'hours'));
              if (olderThan2Hours) {
                finishedCount += varietyActivityCount ?? 0;
                finishedRowsSet.add(varietySession.rowId);
              }
            }
            chartRow.series.push({
              name: varietySession.workerName,
              value: varietyActivityCount ?? 0,
            });
          }
          latestChartData.push(chartRow);
        }
        this.finishedData = {
          totalAll: {
            count: totalCount,
            rows: totalRowsSet.size
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


        const uniqueRows = sessionsData
          .map((value) => value.rowNumber)
          .filter(
            (value: any, index: any, array: string | any[]) =>
              array.indexOf(value) === index
          );


        const latestVarietyTableData = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < uniqueRows.length; i++) {
          const row = uniqueRows[i];
          let rowSpecificSessions = sessionsData.filter((v) => v.rowNumber === row);

          if (this.selectedClientDocData.correctionFactor) {
            rowSpecificSessions = rowSpecificSessions.map(rowSpecificSession => {
              const isOriginal = rowSpecificSession.hasOwnProperty('isOriginal') ? rowSpecificSession.isOriginal : true;
              if (rowSpecificSession.count && isOriginal && !rowSpecificSession.isManual) {
                rowSpecificSession.count = +(rowSpecificSession.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
              }
              return rowSpecificSession;
            });
          }

          let tableRow: any;

          if (this.varietyTableDataMap.get(row)) {
            tableRow = this.varietyTableDataMap.get(row);
          } else {
            tableRow = {
              rowNumber: row,
              amountPicked: 0,
              waste: 0,
              workers: [],
              trolleyNumbers: []
            };
          }
          // tslint:disable-next-line:prefer-for-of
          for (let j = 0; j < rowSpecificSessions.length; j++) {
            const rowActivity = rowSpecificSessions[j];
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

          if (rowSpecificSessions && rowSpecificSessions.length > 0) {
            tableRow.time = `${rowSpecificSessions[0]?.startTimestamp ? moment(rowSpecificSessions[0]?.startTimestamp?.toMillis()).format('HH:mm') : ''}
          - ${rowSpecificSessions[0]?.endTimestamp ? moment(rowSpecificSessions[0]?.endTimestamp?.toMillis()).format('HH:mm') : ''}`;
          }

          this.varietyTableDataMap.set(row, tableRow);
        }

        this.varietyTableDataMap.forEach((value, key) => {
          latestVarietyTableData.push(value);
        });

        Object.assign(this, {varietyData: [...latestChartData]});

        latestVarietyTableData.sort((n1, n2) => {
          return +n1.rowNumber > +n2.rowNumber ? 1 : +n1.rowNumber < +n2.rowNumber ? -1 : 0;
        });
        this.varietiesDataSource = new MatTableDataSource(latestVarietyTableData);
        this.varietiesDataSource.paginator = this.paginator;
        this.varietiesDataSource.sort = this.sort;
      });
  }

  isVarietyChartDisplayed() {
    return (this.varietyChartVsTable === 'chart' ? 'block' : 'none');
  }

  isVarietyTableDisplayed() {
    return (this.varietyChartVsTable === 'table') && (this.varietyData.length > 0) ? 'block' : 'none';
  }

  downloadAsCSV(type) {
    const filename = `${type} ${moment().format('YYYY-MM-DD HHmmss')}`;
    if (!this.varietiesDataSource || !this.varietiesDataSource.data || (this.varietiesDataSource.data.length === 0)) {
      return;
    }
    const csvData = this.ConvertToCSV(this.varietiesDataSource.data, this.rowsColumnsToDisplay);
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
      row += this.varietyAttributesReadableMap.get(header) + ',';
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

  varietySortOptionChanged() {
    if (!this.varietyData || (this.varietyData.length === 0)) {
      return;
    }
    let sortedChartData;
    switch (this.varietySortOption) {
      case 'AZ':
        sortedChartData = this.varietyData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.name < chartRowB.name ? -1 : charRowA.name > chartRowB.name ? 1 : 0;
        });
        break;
      case 'ZA':
        sortedChartData = this.varietyData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.name > chartRowB.name ? -1 : charRowA.name < chartRowB.name ? 1 : 0;
        });
        break;
      case 'HL':
        sortedChartData = this.varietyData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 > n2 ? -1 : n1 < n2 ? 1 : 0;
        });
        break;
      case 'LH':
        sortedChartData = this.varietyData.sort((charRowA: any, chartRowB: any) => {
          const n1 = charRowA.series.reduce((a, b) => a + b.value, 0);
          const n2 = chartRowB.series.reduce((a, b) => a + b.value, 0);
          return n1 < n2 ? -1 : n1 > n2 ? 1 : 0;
        });
        break;
    }
    Object.assign(this, {varietyData: [...sortedChartData]});
  }

}

