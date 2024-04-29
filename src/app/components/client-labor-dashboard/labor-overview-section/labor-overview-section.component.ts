import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {animate, state, style, transition, trigger} from "@angular/animations";
import {interval, Subscription, throttle} from "rxjs";
import {AuthService} from "../../../services/auth.service";
import {FirestoreService} from "../../../services/firestore.service";
import {Router} from "@angular/router";
import {ClientInContextService} from "../../../services/client-in-context.service";
import * as moment from "moment";
import {MatTableDataSource} from "@angular/material/table";
import {ClientMainAttributes} from "../../../common/interfaces/client-interfaces";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {CdkDetailRowDirective} from './cdk-detail-row.directive';
import {TranslateService} from "@ngx-translate/core";
import { GridModalComponent } from 'src/app/common/grid-modal/grid-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-labor-overview-section',
  templateUrl: './labor-overview-section.component.html',
  styleUrls: ['./labor-overview-section.component.scss',
    '../../../common/styles/listing.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed, void', style({height: '0px'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),
  ],
})
export class LaborOverviewSectionComponent implements OnInit, OnDestroy {

  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  dateInContextSubscription: Subscription;
  laborPerformanceDataSubscription: Subscription;
  allWorkersList: any[];
  laborSessionsData: any[];
  selectedDate: Date;
  chartAnimation = true;
  tableDataMap = new Map();
  private openedRow: CdkDetailRowDirective;
  displayedIcon = 'play_circle_outline';

  expandedElement: any = null;

  laborOverviewDataSource: MatTableDataSource<ClientMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  rawLaborPerfData: any[] = [];
  workerSpecificData: {};
  numberOfWorkers: number;
  topLevelAvgDataMap = new Map();

  workerAttributesReadableMap: Map<string, string> = new Map([
    ['workerName', 'Workers'],
    ['startTime', 'Time'],
    ['rowNumber', 'Row'],
    ['trolleyNumber', 'Trolley'],
    ['varietyName', 'Variety'],
    ['netPerformance', 'Performance'],
  ]);

  workerNestedAttributesReadableMap: Map<string, string> = new Map([
    ['time', 'Time'],
    ['rowNumber', 'Row'],
    ['trolleyNumber', 'Trolley'],
    ['varietyName', 'Variety'],
    ['netPerformance', 'Performance'],
    ['amountPicked', 'Count'],
  ]);

  columnsToDisplay: string[] = [
    'workerName',
    'startTime',
    'rowNumber',
    'trolleyNumber',
    'varietyName',
    'netPerformance',
  ];

  columnsToDisplayNested: string[] = [
    'time',
    'rowNumber',
    'trolleyNumber',
    'varietyName',
    'netPerformance',
    'amountPicked',
  ];

  columnsHeadersToDisplay: string[] = [
    'workerName',
    'startTime',
    'rowNumber',
    'trolleyNumber',
    'varietyName',
    'netPerformance',
    'red-dot'
  ];

  columnsHeadersToDisplayNested: string[] = [
    'time',
    'rowNumber',
    'trolleyNumber',
    'varietyName',
    'netPerformance',
    'amountPicked',
    'red-dot'
  ];

  tableData: any[];
  laborSessionsDataSubscription: Subscription;
  clientLocInContextServiceSubscription: Subscription;
  selectedLocationId: string;


  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService,
              public translate: TranslateService,public dialog: MatDialog) {

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
          this.clientLocInContextServiceSubscription = this.clientInContextService.clientLocSubject.subscribe(selectedLocation => {
            this.selectedLocationId = !selectedLocation || (selectedLocation?.id === '-1') ? null : selectedLocation?.id;
            this.rawLaborPerfData = [];
            this.loadTable();
          });
        });
      });

     
  }
  openDialog(element:any) {
    this.expandedElement = element;
    this.dialog.open(GridModalComponent, {
      data: {
        nestedTable: this.expandedElement,
      },
    });
  }
  isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');

  ngOnInit(): void {
  }

  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  loadTable() {
    const dateToQuery = moment(this.selectedDate).format('YYYY-MM-DD');
    this.rawLaborPerfData = [];
    this.workerSpecificData = new Map();
    this.tableDataMap = new Map();
    this.tableData = [];
    this.laborSessionsDataSubscription?.unsubscribe();
    this.laborSessionsDataSubscription = this.firestoreService
      .getUnarchivedSessions(this.selectedClientDocData.id, this.selectedDate, this.selectedLocationId ?? null)
      .pipe(throttle(val => interval(8000))).subscribe(async sessionsData => {
        this.laborSessionsData = sessionsData;
        this.laborSessionsData = this.laborSessionsData.filter(session => session.rowId !== null && session.rowId !== '');
        this.laborSessionsDataSubscription?.unsubscribe();
        const workerRowListMap = this.buildNestedData(this.laborSessionsData);

        this.tableData = [];

        for (const workerRowList of workerRowListMap.values()) {
          const moment30MinsAgo = moment().subtract(30, 'minutes');
          const avgRowForWorkerId = this.getAverageValues(workerRowList);
          const netPerformance = +((avgRowForWorkerId.sum / avgRowForWorkerId.sumNettTime) * (3600)).toFixed(0);
          const grossPerformance = +((avgRowForWorkerId.sum / avgRowForWorkerId.sumGrossTime) * (3600)).toFixed(0);
          const isAnyNestedRowRed = workerRowList
            .filter(row => {
              if (row.showRedButton && row.nettEndTimestamp && row.nettStartTimestamp) {
                if (moment(row.nettEndTimestamp.toMillis()).isAfter(moment30MinsAgo)
                  || ((row.count < 100)
                    && moment(row.nettEndTimestamp?.toMillis()).diff(moment(row?.nettStartTimestamp?.toMillis()), 'minutes', true) < 10)) {
                  return false;
                } else {
                  return true;
                }
              } else {
                return false;
              }
            }).length > 0;
          const perfRatio = grossPerformance / netPerformance;
          this.tableData.push({
            workerId: workerRowList[0].workerId,
            workerName: workerRowList[0].workerName,
            varietyName: workerRowList[0].varietyName,
            startTime: workerRowList[0].startTime,
            netPerformance: !isNaN(netPerformance) ? netPerformance : '-',
            grossPerformance: +avgRowForWorkerId.sum > 0 && !isNaN(grossPerformance) ? grossPerformance : '-',
            rowNumber: workerRowList[0].rowNumber,
            trolleyNumber: workerRowList[0].trolleyNumber,
            timeNet: workerRowList[0].time,//TODO-ccheck
            timeGross: '',//timeStrGross,
            perfRatio: !isNaN(perfRatio) ? perfRatio.toFixed(2) : '-',
            nested: workerRowList,
            isAnyNestedRowRed
          });
        }

        this.tableData.sort((tableRowA: any, tableRowB: any) => {
          return tableRowA.startTime < tableRowB.startTime ? 1
            : tableRowA.startTime > tableRowB.startTime ? -1 : 0;
        });

        this.laborOverviewDataSource = new MatTableDataSource(this.tableData);
        this.laborOverviewDataSource.paginator = this.paginator;
        this.laborOverviewDataSource.sort = this.sort;

        this.topLevelAvgDataMap.set(this.capitalizeFirstLetter('test'), {}); //TODO
      });
  }

  restartStreaming() {
    const dateToQuery = moment(this.selectedDate).format('YYYY-MM-DD');
    this.laborSessionsDataSubscription?.unsubscribe();
    this.laborSessionsDataSubscription = this.firestoreService
      .getUnarchivedSessions(this.selectedClientDocData.id, this.selectedDate).pipe(throttle(val => interval(5000))).subscribe(async sessionsData => {
        //console.log('Live streaming:' + this.expandedElement?.workerId);
        this.laborSessionsData = sessionsData;
        this.laborSessionsData = this.laborSessionsData.filter(session => session.rowId !== null && session.rowId !== '');
        const workerRowListMap = this.buildNestedData(this.laborSessionsData);

        this.tableData = [];

        for (const workerRowList of workerRowListMap.values()) {
          const moment30MinsAgo = moment().subtract(30, 'minutes');
          const avgRowForWorkerId = this.getAverageValues(workerRowList);
          const netPerformance = +((avgRowForWorkerId.sum / avgRowForWorkerId.sumNettTime) * (3600)).toFixed(0);
          const grossPerformance = +((avgRowForWorkerId.sum / avgRowForWorkerId.sumGrossTime) * (3600)).toFixed(0);
          const isAnyNestedRowRed = workerRowList
            .filter(row => {
              if (row.showRedButton && row.nettEndTimestamp && row.nettStartTimestamp) {
                if (moment(row.nettEndTimestamp.toMillis()).isAfter(moment30MinsAgo)
                  || ((row.count < 100)
                    && moment(row.nettEndTimestamp?.toMillis()).diff(moment(row?.nettStartTimestamp?.toMillis()), 'minutes', true) < 10)) {
                  return false;
                } else {
                  return true;
                }
              } else {
                return false;
              }
            }).length > 0;
          const perfRatio = grossPerformance / netPerformance;
          this.tableData.push({
            workerId: workerRowList[0].workerId,
            workerName: workerRowList[0].workerName,
            varietyName: workerRowList[0].varietyName,
            startTime: workerRowList[0].startTime,
            netPerformance: !isNaN(netPerformance) ? netPerformance : '-',
            grossPerformance: +avgRowForWorkerId.sum > 0 && !isNaN(grossPerformance) ? grossPerformance : '-',
            rowNumber: workerRowList[0].rowNumber,
            trolleyNumber: workerRowList[0].trolleyNumber,
            timeNet: workerRowList[0].time,//TODO-ccheck
            timeGross: '',//timeStrGross,
            perfRatio: !isNaN(perfRatio) ? perfRatio.toFixed(2) : '-',
            nested: workerRowList,
            isAnyNestedRowRed
          });
        }

        this.tableData.sort((tableRowA: any, tableRowB: any) => {
          return tableRowA.startTime < tableRowB.startTime ? 1
            : tableRowA.startTime > tableRowB.startTime ? -1 : 0;
        });

        this.laborOverviewDataSource = new MatTableDataSource(this.tableData);
        this.laborOverviewDataSource.paginator = this.paginator;
        this.laborOverviewDataSource.sort = this.sort;

        this.topLevelAvgDataMap.set(this.capitalizeFirstLetter('test'), {}); //TODO

      });
  }

  getAverageValues(workerDataArray) {
    const averageValueObj: any = {};
    let sum = 0;
    let sumNettTime = 0;
    let sumGrossTime = 0;

    for (const workerData of workerDataArray) {
      if (!workerData.nettPerformance || !workerData.grossPerformance
        || (workerData.nettPerformance === '-') || (workerData.grossPerformance === '-')) {
        continue;
      }

      //If any of these 3 values are not present, averages cannot consider this session with accuracy for both net & gross avg. perf. values
      if (!workerData.nettStartTimestamp || !workerData.nettEndTimestamp || !workerData.startTimestamp) {
        continue;
      }

      if (workerData.nettStartTimestamp && workerData.nettEndTimestamp) {
        sumNettTime += (workerData.nettEndTimestamp.toMillis() - workerData.nettStartTimestamp.toMillis()) / 1000;
      }
      if (workerData.startTimestamp && workerData.endTimestamp) {
        sumGrossTime += (workerData.endTimestamp.toMillis() - workerData.startTimestamp.toMillis()) / 1000;
      } else if (workerData.startTimestamp && workerData.nettEndTimestamp) {
        sumGrossTime += (workerData.nettEndTimestamp.toMillis() - workerData.startTimestamp.toMillis()) / 1000;
      }
      sum += workerData.count ? workerData.count : 0;
    }

    averageValueObj.sum = sum;
    averageValueObj.sumNettTime = sumNettTime;
    averageValueObj.sumGrossTime = sumGrossTime;

    return averageValueObj;
  }

  buildNestedData(sessionsData: any[]) {
    const workerRowListMap = new Map();
    for (const session of sessionsData) {
      let workerRowList = [];
      const workerSpecificActivity: any = session;
      if (workerRowListMap.get(session.workerId)) {
        workerRowList = workerRowListMap.get(session.workerId);
      }
      let startTimeWithFallback;
      let endTimeWithFallback;
      if (!session.nettStartTimestamp) {
        startTimeWithFallback = session.startTimestamp;
        endTimeWithFallback = session.endTimestamp
      } else {
        startTimeWithFallback = session.nettStartTimestamp;
        endTimeWithFallback = session.nettEndTimestamp;
      }

      workerSpecificActivity.startTimeWithFallback = startTimeWithFallback;
      workerSpecificActivity.endTimeWithFallback = endTimeWithFallback;

      const perfRatio = session.grossPerformance / session.nettPerformance;
      workerSpecificActivity.trolleyNumber = session.trolleyId ?? '';
      workerSpecificActivity.netPerformance = !isNaN(session.nettPerformance) ? +(session.nettPerformance?.toFixed(0)) : '-';
      workerSpecificActivity.grossPerformance = !isNaN(session.grossPerformance) ? +(session.grossPerformance?.toFixed(0)) : '-';
      workerSpecificActivity.startTime = `${startTimeWithFallback ? moment(startTimeWithFallback?.toMillis()).format('HH:mm') : ''}`;
      workerSpecificActivity.time =
        `${startTimeWithFallback ? moment(startTimeWithFallback?.toMillis()).format('HH:mm') : ''}`
        + ` - ${endTimeWithFallback ? moment(endTimeWithFallback?.toMillis()).format('HH:mm') : ''}`;
      const isOriginal = session.hasOwnProperty('isOriginal') ? session.isOriginal : true;
      if (this.selectedClientDocData.correctionFactor && session.count && isOriginal && !session.isManual) {
        session.count = +(session.count * (1 + (this.selectedClientDocData.correctionFactor))).toFixed(0);
      }
      workerSpecificActivity.amountPicked = session.count;

      workerSpecificActivity.perfRatio = !isNaN(perfRatio) ? perfRatio.toFixed(2) : '-';
      workerSpecificActivity.showRedButton = ((session.perfRatio < 0.80) && (session.count > 150)
        && moment(session?.nettEndTimestamp?.toMillis()).diff(moment(session?.nettStartTimestamp?.toMillis()), 'minutes', true) > 15);
      if (!session.varietyName?.startsWith('na')) {
        session.varietyName = this.capitalizeFirstLetter(session.varietyName);
        workerRowList.push(workerSpecificActivity);
      }
      workerRowList = workerRowList.sort((tableRowA: any, tableRowB: any) => {
        return tableRowA.startTimeWithFallback?.toMillis() < tableRowB.startTimeWithFallback?.toMillis() ? 1
          : tableRowA.startTimeWithFallback?.toMillis() > tableRowB.startTimeWithFallback?.toMillis() ? -1 : 0;
      });
      workerRowListMap.set(session.workerId, workerRowList);
    }
    return workerRowListMap;
  }

  onToggleChange(cdkDetailRow: CdkDetailRowDirective): void {
    if (this.openedRow && this.openedRow.expended) {
      this.openedRow.toggle();
    }
    this.openedRow = cdkDetailRow.expended ? cdkDetailRow : undefined;
  }

  closeRow() {
    this.onToggleChange(this.openedRow);
  }

  isLaborOverviewTableDisplayed() {
    return (this.laborSessionsData?.length > 0) ? 'block' : 'none';
  }

  getKeys(object): string[] {
    //console.log(object);
    return Object.keys(object);
  }

  toggleStreaming() {
    if (this.displayedIcon === 'play_circle_outline') {
      this.displayedIcon = 'pause_circle_outline';
      this.restartStreaming();
    } else {
      this.laborSessionsDataSubscription?.unsubscribe();
      this.displayedIcon = 'play_circle_outline';
    }
  }

  getTooltipForStreamingButton() {
    if (this.displayedIcon === 'play_circle_outline') {
      return 'Start Streaming Data';
    } else {
      return 'Pause Streaming Data';
    }
  }

  expandRow(element: any) {
    this.expandedElement = this.expandedElement?.workerId === element.workerId ? null : element;
    console.log('this.expandedElement',this.expandedElement)
  }

  applyExpandedClass(element: any) {
    return this.expandedElement?.workerId === element.workerId;
  }

  ngOnDestroy(): void {
    this.laborSessionsDataSubscription?.unsubscribe();
    this.clientInContextServiceSubscription.unsubscribe();
    this.dateInContextSubscription.unsubscribe();
    this.clientLocInContextServiceSubscription?.unsubscribe();
    //this.laborPerformanceDataSubscription.unsubscribe();
  }

  doLanguageWork() {
    this.translate.addLangs(['en', 'fr', 'nl']);
    this.translate.setDefaultLang('en');

    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang.match(/en|fr|nl/) ? browserLang : 'en');

    // Example code Translate Reference
    const path = ['SETTINGS', 'GENERAL', 'SECURITY'];
    const type = 'TITLE';
    const text = 'Security settings';

    const firestoreField = {};
    path.push(type, 'TEXT');
    const translateReference = path.join('.');
    path.reduce(
      (o: any, s: string, i: number) =>
        (o[s] = i === path.length - 1 ? text : {}),
      firestoreField
    );

  }
}
