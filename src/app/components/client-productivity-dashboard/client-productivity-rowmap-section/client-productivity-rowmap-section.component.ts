import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import * as moment from "moment/moment";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {FirestoreService} from "../../../services/firestore.service";
import {BreakpointService} from "../../../services/breakpoint.service";

@Component({
  selector: 'app-client-productivity-rowmap-section',
  templateUrl: './client-productivity-rowmap-section.component.html',
  styleUrls: ['./client-productivity-rowmap-section.component.scss']
})
export class ClientProductivityRowmapSectionComponent implements OnInit, OnDestroy {
  @ViewChild('doneCountField') doneCountField: any;
  rows: any[];
  sessions: any[];
  selectedDate: Date;
  screenSize: any;
  doneCount: number;
  dateInContextSubscription: Subscription;
  breakpointSubscription: Subscription;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  states: string[] = ['done', 'skip', 'pending', 'progress', 'add', 'done-below'];
  private productivityDataSubscription: Subscription;
  private lastClientActivityOverall = null;
  private lastClientActivityOverallMoment = null;
  dayDescription = ['Today', 'Done last day', 'Older'];
  private markerTimestampMoment = null;
  private fromDateMoment = null;
  private adjustmentDays = 0;
  selectedLocationId = null;

  barChart = [
    {
      name: 'skip',
      percentage: 0,
      classes: ['bar-card-left', 'skip'],
      numberOfRows: 0
    },
    {
      name: 'added',
      percentage: 0,
      classes: ['bar-card-middle', 'add'],
      numberOfRows: 0
    },
    {
      name: 'pending',
      percentage: 0,
      classes: ['bar-card-middle', 'pending'],
      numberOfRows: 0
    },
    {
      name: 'in progress',
      percentage: 0,
      classes: ['bar-card-middle', 'progress'],
      numberOfRows: 0
    },
    {
      name: 'done-below',
      percentage: 0,
      classes: ['bar-card-middle', 'done-below'],
    },
    {
      name: 'done',
      percentage: 0,
      classes: ['bar-card-right', 'done'],
    }
  ];

  stateCount = [0, 0, 0, 0, 0, 0];
  filteredOn: string = null;
  //locationIdsFromRows: any[];
  rowsToDisplay: any[];
  sessionsSubscription: Subscription;
  clientLocInContextServiceSubscription: Subscription;

  constructor(private clientInContextService: ClientInContextService,
              private firestoreService: FirestoreService,
              private breakpointService: BreakpointService,
              private changeDetectorRef: ChangeDetectorRef) {
    this.breakpointSubscription = this.breakpointService.screenSize$.subscribe(screenSize => this.screenSize = screenSize);
    this.clientLocInContextServiceSubscription = this.clientInContextService.clientLocSubject.subscribe(selectedLocation => {
      this.selectedLocationId = !selectedLocation || (selectedLocation?.id === '-1') ? null : selectedLocation?.id;
      //if (this.selectedClientDocData) {
        this.loadData();
      //}
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.barChart.forEach(block => block.percentage = 0);
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }

      this.rows = [];
      this.selectedClientDocData = selectedClientDocData;

      this.doneCount = selectedClientDocData.doneCount ?? 0;

      this.selectedDate = new Date();
      this.sessionsSubscription?.unsubscribe();
      this.sessionsSubscription = this.firestoreService.getUnarchivedSessions(this.selectedClientDocData.id, this.selectedDate, this.selectedLocationId ?? null)
        .subscribe(sessions => {
          sessions = sessions.filter(session => session.rowId !== null && session.rowId !== '');
          this.sessions = sessions;
          if (!this.selectedLocationId) {
            this.productivityDataSubscription = this.firestoreService.getAllRowsForClientId(this.selectedClientDocData.id).subscribe(rows => {
              this.rows = rows;
              this.fillUI();
            });
          } else {
            this.productivityDataSubscription?.unsubscribe();
            this.productivityDataSubscription = this.firestoreService.getAllRowsForLocIdForClientId(this.selectedClientDocData.id, this.selectedLocationId).subscribe(rows => {
              this.rows = rows;
              this.fillUI();
            });
          }
        });
    });
  }


  fillUI() {
    const filterRowsByLocationId = !!this.selectedLocationId;
    this.stateCount = [0, 0, 0, 0, 0, 0];
    this.lastClientActivityOverall = this.selectedClientDocData.lastActivityDeviceTimestamp;
    this.lastClientActivityOverallMoment = this.lastClientActivityOverall ? moment(this.lastClientActivityOverall.toMillis()) : null;

    const locationIds = this.rows.map(row => row.locationId);
    if (filterRowsByLocationId && this.selectedLocationId) {
      this.rowsToDisplay = this.rows.filter(row => row.locationId === this.selectedLocationId);
    } else {
      this.rowsToDisplay = this.rows;
    }
    this.rowsToDisplay = this.rowsToDisplay
      .map(row => {

        if (this.selectedClientDocData.lastActivityMarkerDate) {
          this.fromDateMoment = moment();
          if (this.selectedClientDocData.lastActivityMarkerDate) {
            this.markerTimestampMoment = moment(this.selectedClientDocData.lastActivityMarkerDate.toMillis());
          }
          if (this.markerTimestampMoment) {
            this.adjustmentDays = moment().startOf('day').diff(this.markerTimestampMoment.clone().startOf('day'), 'days') - 1;
          }
        }

        let lastActivityTimestampMomentForRow;
        if (row.rowLatestActivityTimestamp) {
          lastActivityTimestampMomentForRow = moment(row.rowLatestActivityTimestamp.toMillis());
        } else {
          lastActivityTimestampMomentForRow = row.added ? moment(row.added.toMillis()) : moment().subtract(7, 'days');
        }

        let lastActivityDaysAgo;
        if (this.lastClientActivityOverallMoment.clone().startOf('day').isSame(lastActivityTimestampMomentForRow.clone().startOf('day'))) {
          lastActivityDaysAgo = moment().startOf('day').diff(lastActivityTimestampMomentForRow.clone().startOf('day'), 'days');
        } else {
          lastActivityDaysAgo =
            this.lastClientActivityOverallMoment.clone().startOf('day').diff(lastActivityTimestampMomentForRow.clone().startOf('day'), 'days') - this.adjustmentDays;
        }

        const rowCount = this.sessions.filter(session => session.rowNumber === row.rowNumber)
          .filter(session => !!session.count).map(session => session.count).reduce((accumulator, value) => {
            return accumulator + value;
          }, 0);


        const allInProgressSessionsForRow = this.sessions.filter(session => session.rowNumber === row.rowNumber)
          .filter(session => session.endTimestamp === undefined || session.endTimestamp === null);

        const allSessionsForRow = this.sessions.filter(session => session.rowNumber === row.rowNumber);

        row.inProgress = (moment().startOf('day').diff(lastActivityTimestampMomentForRow.clone().startOf('day'), 'days') === 0)
          && (allInProgressSessionsForRow.length > 0);

        //Below logic puts row state to pending if all of its sessions are archived
        let shouldRemainPending = false;
        if ((moment().startOf('day').diff(lastActivityTimestampMomentForRow.clone().startOf('day'), 'days') === 0)
          && (allSessionsForRow.length === 0)) {
          shouldRemainPending = true;
        }

        let todayToo = false;
        let stateIdx;
        let workerCountStrForCompletedRow = null;
        if (row.todayTooTimestamp && moment(row.todayTooTimestamp.toMillis()).isAfter(lastActivityTimestampMomentForRow)) {
          todayToo = true;
          stateIdx = 4;
        } else {
          if (shouldRemainPending) {
            stateIdx = 2;
          } else {
            stateIdx = row.inProgress
              ? 3
              : Math.min(2, lastActivityDaysAgo);
          }
        }

        if (stateIdx === 0) {
          workerCountStrForCompletedRow = this.sessions
            .filter(session => session.rowId === row.id)
            .filter(session => session.hasOwnProperty('count'))
            .filter(session => session.count > 0)
            .map(session => `${session.workerName} (${session.count ?? 0})`)
            .join(',');
        }
        let state = this.states[stateIdx];
        if (state === 'done' && (rowCount < this.doneCount)) {
          this.stateCount[5]++;
          state = 'done-below';
        } else if (state === 'done') {
          this.stateCount[0]++;
        } else {
          this.stateCount[stateIdx]++;
        }

        let toolTipTopline = '';
        if (state === 'progress') {
          toolTipTopline = this.getBarChartToolTip({name: 'in progress'});
        } else if (state === 'add') {
          toolTipTopline = this.getBarChartToolTip({name: 'added'});
        } else {
          toolTipTopline = this.getBarChartToolTip({name: state});
        }

        const tooltip = {
          topLine: toolTipTopline,
          bottomLine: moment(lastActivityTimestampMomentForRow).format('dddd Do MMMM')
        };

        return {
          ...row,
          count: rowCount,
          todayToo,
          lastActivity: moment(lastActivityTimestampMomentForRow).format('yyyy-MM-DD'),
          lastActivityDaysAgo,
          tooltip,
          state,
          workerCountStrForCompletedRow
        }
      })
      .sort((a, b) => a.rowNumber - b.rowNumber);

    this.barChart[0].percentage = +((this.stateCount[1] / this.rowsToDisplay.length) * 100).toFixed(0);
    this.barChart[0].numberOfRows = this.stateCount[1];
    this.barChart[1].percentage = +((this.stateCount[4] / this.rowsToDisplay.length) * 100).toFixed(0);
    this.barChart[1].numberOfRows = this.stateCount[4];
    this.barChart[2].percentage = +((this.stateCount[2] / this.rowsToDisplay.length) * 100).toFixed(0);
    this.barChart[2].numberOfRows = this.stateCount[2];
    this.barChart[3].percentage = +((this.stateCount[3] / this.rowsToDisplay.length) * 100).toFixed(0);
    this.barChart[3].numberOfRows = this.stateCount[3];
    this.barChart[4].percentage = +((this.stateCount[5] / this.rowsToDisplay.length) * 100).toFixed(0);
    this.barChart[4].numberOfRows = this.stateCount[5];
    this.barChart[5].percentage = +((this.stateCount[0] / this.rowsToDisplay.length) * 100).toFixed(0);
    this.barChart[5].numberOfRows = this.stateCount[0];
  }

  // When clicked on a row the function is executed. Only run if the last activity day is 1 day ago (yesterday).
  async rowClick(rowNumber) {
    const foundIndex = this.rowsToDisplay.findIndex((row) => row.rowNumber === rowNumber);
    const foundRow = this.rowsToDisplay[foundIndex];

    if (!(foundRow.lastActivityDaysAgo === 1)) {
      return;
    }

    if (foundRow.todayTooTimestamp) {
      foundRow.todayToo = false;
      await this.firestoreService.updateRowForLytLocClientId(foundRow.layoutId, foundRow.locationId, foundRow.clientId, {
        id: foundRow.id,
        todayTooTimestamp: null
      });
      foundRow.state = this.states[foundRow.lastActivityDaysAgo];
    } else {
      await this.firestoreService.updateRowForLytLocClientId(foundRow.layoutId, foundRow.locationId, foundRow.clientId, {
        id: foundRow.id,
        todayTooTimestamp: new Date()
      });
      foundRow.todayToo = true;
      foundRow.lastActivity = moment().format('yyyy-MM-DD');
      foundRow.tooltip = `${
        this.dayDescription[Math.min(2, 0)]
      } (${moment(foundRow.lastActivity).format('dddd Do MMMM')})`;
      const todayToo = foundRow.todayToo;
      foundRow.state = this.states[4];
    }
  }


  doneCountChanged() {
    if (+this.doneCount === this.selectedClientDocData.doneCount) {
      this.doneCountField.control.markAsPristine();
      this.doneCountField.control.markAsUntouched({emitEvent: true});
    }
  }

  filterData(item) {
    switch (item.name) {
      case 'in progress':
        if (this.filteredOn === 'progress') {
          return this.filteredOn = null;
        }
        break;
      case 'added':
        if (this.filteredOn === 'add') {
          return this.filteredOn = null;
        }
        break;
      case 'done-below':
        if (this.filteredOn === 'done-below') {
          return this.filteredOn = null;
        }
        break;
      case 'done':
        if (this.filteredOn === 'done') {
          return this.filteredOn = null;
        }
        break;
      case 'skip':
        if (this.filteredOn === 'skip') {
          return this.filteredOn = null;
        }
        break;
      case 'pending':
        if (this.filteredOn === 'pending') {
          return this.filteredOn = null;
        }
        break;
    }
    switch (item.name) {
      case 'in progress':
        this.filteredOn = 'progress';
        break;
      case 'added':
        this.filteredOn = 'add';
        break;
      case 'done-below':
        this.filteredOn = 'done-below';
        break;
      case 'done':
        this.filteredOn = 'done';
        break;
      case 'skip':
        this.filteredOn = 'skip';
        break;
      case 'pending':
        this.filteredOn = 'pending';
        break;
    }

    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.dateInContextSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.productivityDataSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
    this.sessionsSubscription?.unsubscribe();
    this.clientLocInContextServiceSubscription?.unsubscribe();
  }

  async saveMinPickingsForDone() {
    await this.firestoreService.updateClientById(this.selectedClientDocData.id, {
      doneCount: +this.doneCount
    });
    this.doneCountField.control.markAsPristine();
    this.doneCountField.control.markAsUntouched({emitEvent: true});
    this.selectedClientDocData.doneCount = +this.doneCount;
    this.filteredOn = null;
    this.fillUI();
  }

  getRowClass(row) {
    if (row.state !== 'done') {
      return row.state;
    } else {
      if (row.count < this.selectedClientDocData.doneCount) {
        return 'done-below';
      } else {
        return row.state;
      }
    }
  }

  getBarChartToolTip(item) {
    if (item.name !== 'done-below' && item.name !== 'skip') {
      return this.capitalizeFirstLetter(item.name);
    } else if (item.name === 'done-below') {
      return 'Done below threshold';
    } else if (item.name === 'skip') {
      return 'Done last day';
    }
  }

  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getInputBoxToolTip() {
    if (this.doneCountField?.control?.dirty) {
      return 'Save to apply changes';
    } else {
      return 'Edit min. picks for done';
    }
  }

}
