import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {interval, Subscription, throttle} from "rxjs";
import {CdkDetailRowDirective} from "../labor-overview-section/cdk-detail-row.directive";
import {AuthService} from "../../../services/auth.service";
import {FirestoreService} from "../../../services/firestore.service";
import {Router} from "@angular/router";
import {ClientInContextService} from "../../../services/client-in-context.service";
import * as moment from "moment/moment";
import {BreakpointService} from "../../../services/breakpoint.service";

@Component({
  selector: 'app-labor-presences-section',
  templateUrl: './labor-presences-section.component.html',
  styleUrls: ['./labor-presences-section.component.scss']
})
export class LaborPresencesSectionComponent implements OnInit, OnDestroy {
  protected readonly Array = Array;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  dateInContextSubscription: Subscription;
  allWorkersList: any[];
  breakpointSubscription: Subscription;
  groupedWorkersMap = new Map();
  selectedDate: Date;
  groupedListReady = false;

  toggleGroupedUngrouped: 'grouped' | 'ungrouped' = 'grouped';
  allWorkersSubscription: Subscription;
  screenSize: string;
  clientLocInContextServiceSubscription: Subscription;
  selectedLocationId: string;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService,
              private breakpointService: BreakpointService) {


    this.dateInContextSubscription = this.clientInContextService.dateInContextSubject
      .subscribe(dateInContext => {
        if (!dateInContext) {
          const dateNow = new Date();
          this.selectedDate = dateNow;
          this.clientInContextService.dateInContextSubject.next(dateNow);
        } else {
          this.selectedDate = dateInContext;
        }

        this.breakpointSubscription = this.breakpointService.screenSize$.subscribe(screenSize => this.screenSize = screenSize);

        this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
          if (!selectedClientDocData) {
            return;
          }
          this.selectedClientDocData = selectedClientDocData;
          this.clientLocInContextServiceSubscription = this.clientInContextService.clientLocSubject.subscribe(selectedLocation => {
            this.selectedLocationId = !selectedLocation || (selectedLocation?.id === '-1') ? null : selectedLocation?.id;
            this.allWorkersList = [];
            this.loadGroupedWorkers();
          });
        });
      });
  }

  loadGroupedWorkers() {
    this.allWorkersSubscription = this.firestoreService
      .getUnArchivedWorkersForClientId(this.selectedClientDocData.id, this.selectedLocationId ?? null).subscribe((workersList) => {
        this.allWorkersList = workersList.sort((workerA: any, workerB: any) => {
          return workerA.name?.toLowerCase() < workerB.name?.toLowerCase() ? -1 : workerA.name?.toLowerCase() > workerB.name?.toLowerCase() ? 1 : 0;
        });
console.log('worker list',workersList)
        this.groupedWorkersMap = new Map();

        for (const worker of workersList) {
          let groupSpecificWorkerArray = [];
          if (!worker.workerGroupName) {
            worker.workerGroupName = 'NOGROUP';
          }
          if (worker.workerGroupName) {
            groupSpecificWorkerArray = this.groupedWorkersMap.get(worker.workerGroupName);
            if (!groupSpecificWorkerArray) {
              groupSpecificWorkerArray = [];
            }
          }
          groupSpecificWorkerArray.push(worker);
          this.groupedWorkersMap.set(worker.workerGroupName, groupSpecificWorkerArray);
        }
        this.groupedListReady = true;
      });
  }

  ngOnInit(): void {
  }

  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }


  getNumberOfCols() {
    //console.log(this.screenSize);
    if (this.screenSize === 'below-1001') {
      return 6;
    } else if (this.screenSize === 'below-781') {
      return 4;
    } else if (this.screenSize === 'below-501') {
      return 3;
    } else {
      return 8;
    }
  }

  onToggleChange() {
  }

  getClassForWorker(worker) {
    switch (worker.presenceState) {
      case 'NONE':
        return 'presence-state-none';
      case 'START_DAY':
        return 'presence-state-start-day';
      case 'END_DAY':
        return 'presence-state-end-day';
      case 'START_BREAK_PAID':
        return 'presence-state-start-break-paid';
      case 'END_BREAK_PAID':
        return 'presence-state-end-break-paid';
      case 'START_BREAK_UNPAID':
        return 'presence-state-start-break-unpaid';
      case 'END_BREAK_UNPAID':
        return 'presence-state-end-break-unpaid';
      default:
        return 'presence-state-none';
    }
  }
  getStatusForWorker(worker) {
    switch (worker.presenceState) {
      case 'NONE':
        return 'none';
      case 'START_DAY':
        return 'start-day';
      case 'END_DAY':
        return 'end-day';
      case 'START_BREAK_PAID':
        return 'start break-paid';
      case 'END_BREAK_PAID':
        return 'end break-paid';
      case 'START_BREAK_UNPAID':
        return 'start break-unpaid';
      case 'END_BREAK_UNPAID':
        return 'end break-unpaid';
      default:
        return 'none';
    }
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription.unsubscribe();
    this.dateInContextSubscription.unsubscribe();
    this.allWorkersSubscription?.unsubscribe();
    this.clientLocInContextServiceSubscription?.unsubscribe();
  }

  getKeyArrayFromMap() {
    const sortedNonGroupNames = Array.from(this.groupedWorkersMap.keys()).filter(key => key !== 'NOGROUP').sort((groupNameA: any, groupNameB: any) => {
      return groupNameA?.toLowerCase() < groupNameB?.toLowerCase() ? -1 : groupNameA?.toLowerCase() > groupNameB?.toLowerCase() ? 1 : 0;
    });
    if (this.groupedWorkersMap.get('NOGROUP')?.length > 0) {
      return [
        'NOGROUP',
        ...sortedNonGroupNames
      ]
    } else {
      return [
        ...sortedNonGroupNames
      ]
    }
  }
}
