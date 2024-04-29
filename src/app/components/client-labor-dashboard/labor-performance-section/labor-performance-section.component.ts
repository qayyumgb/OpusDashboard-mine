import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {AuthService} from "../../../services/auth.service";
import {FirestoreService} from "../../../services/firestore.service";
import {Router} from "@angular/router";
import {ClientInContextService} from "../../../services/client-in-context.service";
import * as moment from "moment/moment";
import {MatSort, MatSortable} from "@angular/material/sort";
import {Color, ScaleType} from "@swimlane/ngx-charts";
import {MatTableDataSource} from "@angular/material/table";
import {ClientMainAttributes} from "../../../common/interfaces/client-interfaces";
import {MatPaginator} from "@angular/material/paginator";

interface ChartSerie {
  name: string;
  value: number;
}

interface ChartRow {
  name: string;
  series: ChartSerie[];
}

@Component({
  selector: 'app-labor-performance-section',
  templateUrl: './labor-performance-section.component.html',
  styleUrls: ['./labor-performance-section.component.scss',
    '../../../common/styles/listing.scss']
})
export class LaborPerformanceSectionComponent implements OnInit, OnDestroy {

  performanceChartVsTable = 'chart';
  avgVsWorkerSpecificChart = 'avg';
  netVsGross = 'gross';
  performanceSortOption = '-1'; //-1 = All averages
  dataSortOption = 'PerfH2L';
  dataWorkerSpecificSortOption = 'NetPerfH2L';
  selectedDate: Date;
  chartAnimation = true;
  clientLocInContextServiceSubscription: Subscription;
  selectedLocationId: string;


  allAvgsPerformanceData: any[] = [];
  workerSpecificPerformanceData: any[] = [];
  allValuesZero = false;

  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  legendTitle = '';
  showXAxisLabel = true;
  yAxisLabel = 'Worker';
  yAxisLabelWorkerSpecific = 'Variety';
  showYAxisLabel = true;
  xAxisLabel = 'Average Performance (pieces/hour)';
  showDataLabel = true;
  roundDomains = true;
  tableDataMap = new Map();
  barPadding = 2;
  barPaddingWorkerSpecific = 2;

  graphHeight: number;
  graphHeightWorkerSpecific: number;

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

  colorScheme: Color = {
    domain: [
      '#00ccb3',
      '#d81159',
      '#e45932',
      '#efa00b',
      '#00aebf',
      '#00e9a7',
      '#13a384',
      '#265c60',
    ],
    group: ScaleType.Ordinal,
    selectable: true,
    name: 'Labor Performance',
  };

  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  dateInContextSubscription: Subscription;
  sessionsSubscription: Subscription;
  allWorkersList: any[];
  allAverageRowsByWorkerId = new Map();

  laborPerfAttributesReadableMap: Map<string, string> = new Map([
    ['workerName', 'Worker'],
    ['variety', 'Variety'],
    ['amountPicked', 'Amount Picked'],
    ['netPerformance', 'Net Performance'],
    ['grossPerformance', 'Gross Performance'],
    ['rowNumber', 'Row Number'],
    ['trolleyNumbers', 'Trolley Number'],
    ['time', 'Time']
  ]);

  laborPerfColumnsToDisplay: string[] = [
    'workerName',
    'variety',
    'amountPicked',
    'netPerformance',
    'grossPerformance',
    'rowNumber',
    'trolleyNumbers',
    'time'
  ];
  columnsHeadersToDisplay: string[] = [
    'workerName',
    'variety',
    'amountPicked',
    'netPerformance',
    'grossPerformance',
    'rowNumber',
    'trolleyNumbers',
    'time'
  ];
  laborPerfDataSource: MatTableDataSource<ClientMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  sessionsData: any[] = [];
  workerSpecificData: {};
  numberOfWorkers: number;
  completeDataMap = new Map();
  completeWorkerDataMap = new Map();

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService) {

    this.dateInContextSubscription = this.clientInContextService.dateInContextSubject
      .subscribe(dateInContext => {
        this.avgVsWorkerSpecificChart = 'avg';
        this.performanceSortOption = '-1';
        this.netVsGross = 'gross';
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
          this.clientLocInContextServiceSubscription = this.clientInContextService.clientLocSubject.subscribe(selectedLocation => {
            this.selectedLocationId = !selectedLocation || (selectedLocation?.id === '-1') ? null : selectedLocation?.id;
            this.sessionsData = [];
            this.workerSpecificPerformanceData = [];
            if ((this.isWorkerSpecificPerfChartDisplayed() === 'block') && (this.performanceSortOption !== '-1')) {
              this.sessionsSubscription?.unsubscribe();
              this.loadAllAveragesChart(true);
            } else {
              this.loadAllAveragesChart(false);
            }
          });

        });
      });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.dateInContextSubscription?.unsubscribe();
    this.sessionsSubscription?.unsubscribe();
    this.clientLocInContextServiceSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }

  onSelect(event) {
    console.log(event);
  }

  getToolTipForAvgsChart(model) {
    const filteredRowSection = this.completeDataMap.get(model.series);
    let tooltipHtml = `<div style="font-weight: 600;text-align: center;">Average performance</div>
                Picked: ${filteredRowSection.count ?? 'NA'}<br/>`;
    tooltipHtml += `Performance: ${filteredRowSection.nettPerformance?.toFixed(0)} per hours<br/>`
    return tooltipHtml;
  }

  getToolTipForWorkerSpecificChart(model) {
    const filteredRowSection = this.completeWorkerDataMap.get(model.series);
    let tooltipHtml = `<div style="font-weight: 600;text-align: center;">`;
    let timeStr = '';
    if (this.netVsGross === 'net') {
      tooltipHtml += `Net Performance`;
      timeStr = `${filteredRowSection?.nettStartTimestamp ? moment(filteredRowSection?.nettStartTimestamp?.toMillis()).format('HH:mm') : ''} `
        + `- ${filteredRowSection?.nettEndTimestamp ? moment(filteredRowSection?.nettEndTimestamp?.toMillis()).format('HH:mm') : ''}`;
    } else {
      tooltipHtml += `Gross Performance`;
      timeStr = `${filteredRowSection?.startTimestamp ? moment(filteredRowSection?.startTimestamp?.toMillis()).format('HH:mm') : ''} `
        + `- ${filteredRowSection?.endTimestamp ? moment(filteredRowSection?.endTimestamp?.toMillis()).format('HH:mm') : ''}`;
    }
    tooltipHtml += `</div>`;
    tooltipHtml += `Picked: ${filteredRowSection.count ?? 'NA'}<br/>`;
    tooltipHtml += `Net Performance: ${filteredRowSection.nettPerformance?.toFixed(0)} per hours<br/>`;
    tooltipHtml += `Gross Performance: ${filteredRowSection.grossPerformance?.toFixed(0)} per hours<br/>`;
    if (filteredRowSection.rowNumber && (filteredRowSection.rowNumber !== 'na')) {
      tooltipHtml += `Row: ${filteredRowSection.rowNumber ?? ''}<br/>`;
      tooltipHtml += `Trolley: ${filteredRowSection.trolleyId ?? ''}<br/>`;
      tooltipHtml += `Time: ${timeStr}`;
    }
    return tooltipHtml;
  }

  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  loadAllAveragesChart(loadWorkerSpecific) {
    const dateToQuery = moment(this.selectedDate).format('YYYY-MM-DD');
    this.allAvgsPerformanceData = [];
    this.sessionsData = [];
    this.sessionsSubscription?.unsubscribe();
    this.sessionsSubscription = this.firestoreService.getUnarchivedSessions(this.selectedClientDocData.id, dateToQuery, this.selectedLocationId ?? null)
      .subscribe(async sessionsData => {
      if (!sessionsData) {
        return;
      }

      sessionsData = sessionsData
        .filter(session => session.rowId !== null && session.rowId !== '')
      //.filter(session => (session.endTimestamp !== null) && (session.endTimestamp !== '') && session.hasOwnProperty('endTimestamp'));

      console.log(dateToQuery)

      this.sessionsData = sessionsData;

      let totalCount = 0;
      let finishedCount = 0;
      const totalRowsSet = new Set();
      const finishedRowsSet = new Set();

      for (const sessionObj of sessionsData) {
        const isOriginal = sessionObj.hasOwnProperty('isOriginal') ? sessionObj.isOriginal : true;

        if (sessionObj.count && !isNaN(sessionObj.count)) {
          if (isOriginal && !sessionObj.isManual && this.selectedClientDocData.correctionFactor) {
            totalCount += +(sessionObj.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
          } else {
            totalCount += sessionObj.count;
          }
        }
        totalRowsSet.add(sessionObj.rowId);

        if (sessionObj.endTimestamp) {
          if (sessionObj.count && !isNaN(sessionObj.count)) {
            if (isOriginal && !sessionObj.isManual && this.selectedClientDocData.correctionFactor) {
              finishedCount += +(sessionObj.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
            } else {
              finishedCount += sessionObj.count;
            }
          }
          finishedRowsSet.add(sessionObj.rowId);
        } else if (sessionObj.startTimestamp) {
          const sessionStartTime = sessionObj.startTimestamp;
          const olderThan2Hours = moment(sessionStartTime.toDate()).isBefore(moment().subtract(2, 'hours'));
          if (olderThan2Hours) {
            if (sessionObj.count && !isNaN(sessionObj.count)) {
              if (isOriginal && !sessionObj.isManual && this.selectedClientDocData.correctionFactor) {
                finishedCount += +(sessionObj.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
              } else {
                finishedCount += sessionObj.count;
              }
            }
            finishedRowsSet.add(sessionObj.rowId);
          }
        }
      }

      this.countData = {
        totalAll: {
          count: totalCount,
          rows: totalRowsSet.size
        },
        finished: {
          count: finishedCount,
          rows: finishedRowsSet.size
        },
      }
      this.workerSpecificData = this.getWorkerRowListMap(sessionsData);
      this.tableDataMap = new Map();
      await this.loadWorkers(sessionsData);

      if (this.numberOfWorkers === 1) {
        this.graphHeight = 110;
      } else if (this.numberOfWorkers > 1 && this.numberOfWorkers <= 7) {
        this.graphHeight = this.numberOfWorkers * 80;
        this.barPadding = 5;
      } else {
        this.graphHeight = this.numberOfWorkers * 48;
        this.barPadding = 5;
      }

      if ((this.isWorkerSpecificPerfChartDisplayed() === 'block') && (this.performanceSortOption !== '-1')) {
        this.loadWorkerSpecificPerformanceChart(this.performanceSortOption);
        return;
      }

      let latestChartData = [];
      // tslint:disable-next-line:prefer-for-of
      const workerIdArray = Array.from(this.tableDataMap.keys());

      // tslint:disable-next-line:prefer-for-of
      for (let j = 0; j < workerIdArray.length; j++) {
        const avgRowForWorkerId = this.getAverageRowForWorker(this.tableDataMap.get(workerIdArray[j]));

        if (avgRowForWorkerId.grossPerformance === Infinity || avgRowForWorkerId.nettPerformance === Infinity) {
          continue;
        }

        this.allAverageRowsByWorkerId.set(workerIdArray[j], avgRowForWorkerId);

        const chartRow = {
          name: this.capitalizeFirstLetter(this.tableDataMap.get(workerIdArray[j])[0]?.workerName),
          series: [
            {
              name: 'performance',
              value: !isNaN(avgRowForWorkerId?.nettPerformance) ? +(avgRowForWorkerId?.nettPerformance?.toFixed(0)) : 0,
              perfRatio: !isNaN(avgRowForWorkerId?.nettPerformance) && !isNaN(avgRowForWorkerId?.grossPerformance) ?
                (+(avgRowForWorkerId?.grossPerformance) / +(avgRowForWorkerId?.nettPerformance)).toFixed(2) : 0
            }
          ]
        };

        this.completeDataMap.set(chartRow.name, avgRowForWorkerId);

        latestChartData.push(chartRow);
      }

      latestChartData = latestChartData.sort((charRowA: any, chartRowB: any) => {
        return charRowA.series[0].perfRatio > chartRowB.series[0].perfRatio ? 1 : charRowA.series[0].perfRatio < chartRowB.series[0].perfRatio ? -1 : 0;
      });

      Object.assign(this, {allAvgsPerformanceData: [...latestChartData]});
      this.loadTable();
    });
  }

  getAverageRowForWorker(workerDataArray) {
    const averageValueObj: any = {};
    let sum = 0;
    let sumNettTime = 0;
    let sumGrossTime = 0;

    for (const workerData of workerDataArray) {
      const isOriginal = workerData.hasOwnProperty('isOriginal') ? workerData.isOriginal : true;
      if (this.selectedClientDocData.correctionFactor && isOriginal && !workerData.isManual && workerData.count) {
        sum += +(workerData.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
      } else {
        sum += workerData.count ? workerData.count : 0;
      }

      if (workerData.nettStartTimestamp && workerData.nettEndTimestamp) {
        sumNettTime += (workerData.nettEndTimestamp.toMillis() - workerData.nettStartTimestamp.toMillis()) / 1000;
      }
      if (workerData.startTimestamp && workerData.endTimestamp) {
        sumGrossTime += (workerData.endTimestamp.toMillis() - workerData.startTimestamp.toMillis()) / 1000;
      }
    }

    averageValueObj.sum = sum;
    averageValueObj.count = sum;
    averageValueObj.sumNettTime = sumNettTime;
    averageValueObj.sumGrossTime = sumGrossTime;

    averageValueObj.nettPerformance = +((sum / sumNettTime) * (3600)).toFixed(0);
    averageValueObj.grossPerformance = +((sum / sumGrossTime) * (3600)).toFixed(0);

    return averageValueObj;
  }

  async loadWorkers(sessionsData) {
    this.numberOfWorkers = 0;
    const workerMap = new Map();
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < sessionsData.length; i++) {
      if (!this.tableDataMap.get(sessionsData[i].workerId)) {
        this.tableDataMap.set(sessionsData[i].workerId, []);
        workerMap.set(sessionsData[i].workerId, {
          workerId: sessionsData[i].workerId,
          workerName: sessionsData[i].workerName
        });
        this.numberOfWorkers++;
      }
      this.allWorkersList = Array.from(workerMap.values());

      this.allWorkersList = this.allWorkersList.sort((w1, w2) => {
        return w1.workerName.toLowerCase() > w2.workerName.toLowerCase() ? 1 : w1.workerName.toLowerCase() < w2.workerName.toLowerCase() ? -1 : 0;
      });
      this.tableDataMap.get(sessionsData[i].workerId).push(sessionsData[i]);
    }
  }

  getWorkerRowListMap(sessionsData) {
    const workerRowListMap = {};
    const varietyCountMap = new Map(); //because variety can repeat in different rows
    // tslint:disable-next-line:prefer-for-of
    for (let k = 0; k < sessionsData.length; k++) {
      const sessionRecord = sessionsData[k];
      let workerIdSpecificMapEntry = workerRowListMap[`${sessionRecord.workerId}`];
      let currentVarietyCount = varietyCountMap.get(sessionRecord.workerId + sessionRecord.rowId + sessionRecord.varietyName);
      if (currentVarietyCount) {
        varietyCountMap.set(sessionRecord.workerId + sessionRecord.rowId + sessionRecord.varietyName, currentVarietyCount + 1);
        currentVarietyCount++;
      } else {
        varietyCountMap.set(sessionRecord.workerId + sessionRecord.rowId + sessionRecord.varietyName, 1);
        currentVarietyCount = 1;
      }
      if (!workerIdSpecificMapEntry) {
        workerIdSpecificMapEntry = {};
        const rowIdSpecificActivityList = [];
        rowIdSpecificActivityList.push({
          ...sessionRecord,
          varietyName: sessionRecord.varietyName + '-' + currentVarietyCount
        });
        workerIdSpecificMapEntry[`${sessionRecord.rowId}`] = rowIdSpecificActivityList;
        //console.log('workerIdSpecificMapEntry-1:' + JSON.stringify(workerIdSpecificMapEntry));
      } else {
        let rowIdSpecificActivityList = workerIdSpecificMapEntry[`${sessionRecord.rowId}`];
        if (rowIdSpecificActivityList) {
          const existingLength = rowIdSpecificActivityList.length;
          rowIdSpecificActivityList.push({
            ...sessionRecord,
            varietyName: sessionRecord.varietyName + '-' + currentVarietyCount
          });
          workerIdSpecificMapEntry[`${sessionRecord.rowId}`] = rowIdSpecificActivityList;
          //console.log('workerIdSpecificMapEntry-2:' + JSON.stringify(workerIdSpecificMapEntry));
        } else {
          rowIdSpecificActivityList = [];
          rowIdSpecificActivityList.push({
            ...sessionRecord,
            varietyName: sessionRecord.varietyName + '-' + currentVarietyCount
          });
          workerIdSpecificMapEntry[`${sessionRecord.rowId}`] = rowIdSpecificActivityList;
          //console.log('workerIdSpecificMapEntry-3:' + JSON.stringify(workerIdSpecificMapEntry));
        }
      }
      workerRowListMap[`${sessionRecord.workerId}`] = workerIdSpecificMapEntry;
      //console.log(`workerRowListMap for k=${k}:` + JSON.stringify(workerRowListMap));
    }
    return workerRowListMap;
  }

  loadTable() {
    let tableData = this.sessionsData;
    tableData = tableData
      .map(session => {
        let timeStr = '';
        if (this.netVsGross === 'net') {
          timeStr = `${session?.nettStartTimestamp ? moment(session?.nettStartTimestamp?.toMillis()).format('HH:mm') : ''}`
            + `- ${session?.nettEndTimestamp ? moment(session?.nettEndTimestamp?.toMillis()).format('HH:mm') : ''}`;
        } else {
          timeStr = `${session?.startTimestamp ? moment(session?.startTimestamp?.toMillis()).format('HH:mm') : ''}`
            + `- ${session?.endTimestamp ? moment(session?.endTimestamp?.toMillis()).format('HH:mm') : ''}`;
        }

        const isOriginal = session.hasOwnProperty('isOriginal') ? session.isOriginal : true;
        if (this.selectedClientDocData.correctionFactor && session.count && isOriginal && !session.isManual) {
          session.count = +(session.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
        }

        return {
          workerName: session.workerName,
          amountPicked: session.count,
          variety: session.varietyName,
          netPerformance: session.nettPerformance ? +(session.nettPerformance).toFixed(0) : '-',
          grossPerformance: session.grossPerformance ? +(session.grossPerformance).toFixed(0) : '-',
          rowNumber: session.rowNumber,
          trolleyNumbers: session.trolleyId,
          time: timeStr
        }
      });

    tableData.sort((n1, n2) => {
      return +n1.grossPerformance > +n2.grossPerformance ? -1 : +n1.grossPerformance < +n2.grossPerformance ? 1 : 0;
    });

    this.laborPerfDataSource = new MatTableDataSource(tableData);
    this.laborPerfDataSource.paginator = this.paginator;
    this.laborPerfDataSource.sort = this.sort;
  }

  isChartSectionDisplayed() {
    return (this.performanceChartVsTable === 'chart' ? 'block' : 'none');
  }

  isAvgPerformanceChartDisplayed() {
    return (this.performanceChartVsTable === 'chart' && this.avgVsWorkerSpecificChart === 'avg' ? 'block' : 'none');
  }

  isWorkerSpecificPerfChartDisplayed() {
    return (this.performanceChartVsTable === 'chart' && this.avgVsWorkerSpecificChart === 'worker' &&
    (this.workerSpecificPerformanceData.length > 0) ? 'block' : 'none');
  }

  isPerformanceTableDisplayed() {
    return (this.performanceChartVsTable === 'table' && (this.sessionsData.length > 0) ? 'block' : 'none');
  }

  performanceSortOptionChanged() {
    if (this.performanceSortOption === '-1') {
      this.avgVsWorkerSpecificChart = 'avg';
    } else {
      this.avgVsWorkerSpecificChart = 'worker';
      this.dataWorkerSpecificSortOption = 'NetPerfH2L';
      this.loadWorkerSpecificPerformanceChart(this.performanceSortOption);
    }
  }

  downloadAsCSV(type) {
    const filename = `${type} ${moment().format('YYYY-MM-DD HHmmss')}`;
    if (!this.sessionsData || (this.sessionsData.length === 0)) {
      return;
    }
    const csvData = this.ConvertToCSV(this.laborPerfDataSource.data, this.laborPerfColumnsToDisplay);
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
      row += this.laborPerfAttributesReadableMap.get(header) + ',';
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

  loadWorkerSpecificPerformanceChart(workerId) {
    let latestWorkerSpecificChartData = [];
    const workerSpecificMap = this.workerSpecificData ? this.workerSpecificData[workerId] : {};
    const rowIds = Object.keys(workerSpecificMap);
    const workerSpecificActivityList = [];
    for (const rowId of rowIds) {
      workerSpecificActivityList.push(...workerSpecificMap[rowId]);
    }

    if (workerSpecificActivityList.length === 1) {
      this.graphHeightWorkerSpecific = 110;
    } else if (workerSpecificActivityList.length > 1 && workerSpecificActivityList.length <= 7) {
      this.graphHeightWorkerSpecific = workerSpecificActivityList.length * 70;
      this.barPaddingWorkerSpecific = 5;
    } else {
      this.graphHeightWorkerSpecific = 550;
      this.barPaddingWorkerSpecific = 5;
    }
    let averageRow = null;
    workerSpecificActivityList.push({...this.allAverageRowsByWorkerId.get(workerId), varietyName: 'na'});
    for (const workerSpecificActivity of workerSpecificActivityList) {
      let varietyName;
      if (workerSpecificActivity.varietyName.startsWith('na')) {
        varietyName = 'Average';
      } else {
        const originalVarietyNameWithDash = this.capitalizeFirstLetter(workerSpecificActivity.varietyName);
        varietyName = this.capitalizeFirstLetter(workerSpecificActivity.varietyName);
        const dashIndex = varietyName.lastIndexOf('-');
        if (dashIndex !== -1) {
          varietyName = varietyName.substring(0, dashIndex);
          if (workerSpecificActivityList.filter(activity => activity.varietyName.startsWith(varietyName) && activity.rowNumber === workerSpecificActivity.rowNumber).length > 1) {
            varietyName = `${varietyName}(${workerSpecificActivity.rowNumber}) [${originalVarietyNameWithDash.substring(dashIndex + 1)}]`;
          } else {
            varietyName = `${varietyName}(${workerSpecificActivity.rowNumber})`
          }
        }
      }

      const chartRow = {
        name: varietyName,
        series: [
          {
            name: 'net',
            value: !isNaN(workerSpecificActivity?.nettPerformance) ? +(workerSpecificActivity?.nettPerformance?.toFixed(0)) : 0,
            rowNumber: workerSpecificActivity.rowNumber
          },
          {
            name: 'gross',
            value: !isNaN(workerSpecificActivity?.grossPerformance) ? +(workerSpecificActivity?.grossPerformance?.toFixed(0)) : 0,
            rowNumber: workerSpecificActivity.rowNumber
          }
        ]
      };

      //Note - uncomment the if-logic if zero valued rows are not to be shown in table as well
      //if (chartRow.series[0].value !== 0 || chartRow.series[1].value !== 0) {
      this.completeWorkerDataMap.set(chartRow.name, workerSpecificActivity);
      //}

      if (varietyName === 'Average') {
        averageRow = chartRow;
      } else {
        if (chartRow.series[0].value !== 0 || chartRow.series[1].value !== 0) {
          latestWorkerSpecificChartData.push(chartRow);
        }
      }
    }

    latestWorkerSpecificChartData = latestWorkerSpecificChartData.sort((charRowA: any, chartRowB: any) => {
      return charRowA.series[0].value < chartRowB.series[0].value ? 1 : charRowA.series[0].value > chartRowB.series[0].value ? -1 : 0;
    });

    this.allValuesZero = (latestWorkerSpecificChartData.filter(chartRow => chartRow.series[0].value !== 0 || chartRow.series[1].value !== 0).length === 0)
      || (latestWorkerSpecificChartData.length === 0);

    //Average row always appears at the top
    if (averageRow) {
      latestWorkerSpecificChartData.unshift(averageRow);
    }

    Object.assign(this, {workerSpecificPerformanceData: [...latestWorkerSpecificChartData]});
  }

  dataSortOptionChanged() {
    if (!this.allAvgsPerformanceData || (this.allAvgsPerformanceData.length === 0)) {
      return;
    }
    console.log(this.dataSortOption);
    let sortedChartData;
    switch (this.dataSortOption) {
      case 'AZ':
        sortedChartData = this.allAvgsPerformanceData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.name < chartRowB.name ? -1 : charRowA.name > chartRowB.name ? 1 : 0;
        });
        break;
      case 'ZA':
        sortedChartData = this.allAvgsPerformanceData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.name < chartRowB.name ? 1 : charRowA.name > chartRowB.name ? -1 : 0;
        });
        break;
      case 'PerfH2L':
        sortedChartData = this.allAvgsPerformanceData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.series[0].perfRatio < chartRowB.series[0].perfRatio ? -1 : charRowA.series[0].perfRatio > chartRowB.series[0].perfRatio ? 1 : 0;
        });
        break;
      case 'PerfL2H':
        sortedChartData = this.allAvgsPerformanceData.sort((charRowA: any, chartRowB: any) => {
          return charRowA.series[0].perfRatio < chartRowB.series[0].perfRatio ? 1 : charRowA.series[0].perfRatio > chartRowB.series[0].perfRatio ? -1 : 0;
        });
        break;
    }
    Object.assign(this, {allAvgsPerformanceData: [...sortedChartData]});
  }

  dataWorkerSpecificSortOptionChanged() {
    if (!this.workerSpecificPerformanceData || (this.workerSpecificPerformanceData.length === 0)) {
      return;
    }
    console.log(this.dataWorkerSpecificSortOption);
    let sortedChartData;
    switch (this.dataWorkerSpecificSortOption) {
      case 'AZ':
        sortedChartData = this.workerSpecificPerformanceData
          //.filter(charRow => charRow.series[0].rowNumber !== 'na')
          .sort((charRowA: any, chartRowB: any) => {
            return charRowA.name < chartRowB.name ? -1 : charRowA.name > chartRowB.name ? 1 : 0;
          });
        //sortedChartData.unshift(this.workerSpecificPerformanceData.filter(charRow => charRow.series[0].rowNumber === 'na')[0]);
        break;
      case 'ZA':
        sortedChartData = this.workerSpecificPerformanceData
          //.filter(charRow => charRow.series[0].rowNumber !== 'na')
          .sort((charRowA: any, chartRowB: any) => {
            return charRowA.name < chartRowB.name ? 1 : charRowA.name > chartRowB.name ? -1 : 0;
          });
        //sortedChartData.unshift(this.workerSpecificPerformanceData.filter(charRow => charRow.series[0].rowNumber === 'na')[0]);
        break;
      case 'NetPerfH2L':
        sortedChartData = this.workerSpecificPerformanceData
          //.filter(charRow => charRow.series[0].rowNumber !== 'na')
          .sort((charRowA: any, chartRowB: any) => {
            return charRowA.series[0].value < chartRowB.series[0].value ? 1 : charRowA.series[0].value > chartRowB.series[0].value ? -1 : 0;
          });
        //sortedChartData.unshift(this.workerSpecificPerformanceData.filter(charRow => charRow.series[0].rowNumber === 'na')[0]);
        break;
      case 'NetPerfL2H':
        sortedChartData = this.workerSpecificPerformanceData
          //.filter(charRow => charRow.series[0].rowNumber !== 'na')
          .sort((charRowA: any, chartRowB: any) => {
            return charRowA.series[0].value < chartRowB.series[0].value ? -1 : charRowA.series[0].value > chartRowB.series[0].value ? 1 : 0;
          });
        //sortedChartData.unshift(this.workerSpecificPerformanceData.filter(charRow => charRow.series[0].rowNumber === 'na')[0]);
        break;
      case 'RowH2L':
        sortedChartData = this.workerSpecificPerformanceData
          //.filter(charRow => charRow.series[0].rowNumber !== 'na')
          .sort((charRowA: any, chartRowB: any) => {
            return +charRowA.series[0].rowNumber < +chartRowB.series[0].rowNumber ? 1 : +charRowA.series[0].rowNumber > +chartRowB.series[0].rowNumber ? -1 : 0;
          });
        //sortedChartData.unshift(this.workerSpecificPerformanceData.filter(charRow => charRow.series[0].rowNumber === 'na')[0]);
        break;
      case 'RowL2H':
        sortedChartData = this.workerSpecificPerformanceData
          //.filter(charRow => charRow.series[0].rowNumber !== 'na')
          .sort((charRowA: any, chartRowB: any) => {
            return +charRowA.series[0].rowNumber < +chartRowB.series[0].rowNumber ? -1 : +charRowA.series[0].rowNumber > +chartRowB.series[0].rowNumber ? 1 : 0;
          });
        //sortedChartData.unshift(this.workerSpecificPerformanceData.filter(charRow => charRow.series[0].rowNumber === 'na')[0]);
        break;
    }
    Object.assign(this, {workerSpecificPerformanceData: [...sortedChartData]});
  }
}
