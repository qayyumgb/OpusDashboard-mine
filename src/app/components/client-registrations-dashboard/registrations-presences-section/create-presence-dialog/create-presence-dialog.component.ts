import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../../services/firestore.service';
import {ClientInContextService} from '../../../../services/client-in-context.service';
import {AuthService} from '../../../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import * as moment from 'moment-timezone';
import {TIME_ZONE} from '../../../../common/utils/time-utils';
import {SNACKBAR_CLASSES} from '../../../../common/utils/utils';
import {v4 as uuidv4} from 'uuid';
import {NgForm} from '@angular/forms';


@Component({
  selector: 'app-create-presence-dialog',
  templateUrl: './create-presence-dialog.component.html',
  styleUrls: ['./create-presence-dialog.component.scss']
})
export class CreatePresenceDialogComponent implements OnInit, OnDestroy {
  locationId: string;
  workerId: string;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  breakRegnsDisplayed: any[] = [];
  allWorkersList: any[];
  workersListSubscription: Subscription;
  allLocationsList: any[];
  locationListSubscription: Subscription;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  regnsSubscription: Subscription;
  beingSaved = false;
  startDayTaskRegn: any;
  endDayTaskRegn: any;
  @ViewChild('editPresenceform') public editForm: NgForm;


  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreatePresenceDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    //console.log(moment(this.regnRecordBeingEdited.startTs.toDate()).tz())
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      this.startDayTaskRegn = {
        id: null,
        isShown: false,
        locatonId: null,
        endTime: null,
      };
      this.endDayTaskRegn = {
        id: null,
        isShown: false,
        locatonId: null,
        endTime: null,
      };
    });

    this.workersListSubscription = this.firestoreService
      .getUnArchivedWorkersForClientId(this.selectedClientDocData?.id)
      .subscribe((workerList) => {
        this.allWorkersList = workerList;
      });
    this.locationListSubscription = this.firestoreService
      .getAllLocationsForClientId(this.selectedClientDocData?.id)
      .subscribe((locationsList) => (this.allLocationsList = locationsList));
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }


  ngOnDestroy(): void {
    this.workersListSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.regnsSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }


  getBreakRegnsToDisplay() {
    return this.breakRegnsDisplayed.filter(regn => !regn.isDeleted);
  }

  deleteBreakRegn(regn, idx) {
    if (regn.id) {
      const deletedRegn: any = this.breakRegnsDisplayed.filter(br => br.id === regn.id);
      deletedRegn[0].isDeleted = true;
    } else {
      this.breakRegnsDisplayed.splice(idx, 1);
    }
  }

  addNewBreakRegn(regn, idx) {
    const index = this.breakRegnsDisplayed.findIndex(br => br.id === regn.id);
    const newBreakRegn = {
      uuid: uuidv4(),
      name: '',
      startTime: null,
      endTime: null,
      isPaid: false
    };
    this.breakRegnsDisplayed = [...this.breakRegnsDisplayed.slice(0, index + 1), newBreakRegn, ...this.breakRegnsDisplayed.slice(index + 1, this.breakRegnsDisplayed.length)];
  }

  addBreakRegnOnTop() {
    const newBreakRegn = {
      uuid: uuidv4(),
      name: '',
      startTime: null,
      endTime: null,
      isPaid: false
    };
    this.breakRegnsDisplayed.unshift(newBreakRegn);
  }

  cancelPresenceSave() {
    this.dialogRef.close();
  }

  async createPresenceNRegistrations() {
    console.log(JSON.stringify(this.editForm.valid));
    if (!this.editForm.valid) {
      this.openSnackBar('Please fill all mandatory fields', 'error');
      return;
    }
    if (this.startDayTaskRegn && this.startDayTaskRegn.isShown) {
      //Create startDayRegn - TODO
    } else {
      this.openSnackBar('Start day creation is mandatory', 'error');
    }
    if (this.endDayTaskRegn && this.endDayTaskRegn.isShown) {
      //Create endDayRegn - TODO
    } else {
      this.openSnackBar('End day creation is mandatory', 'error');
    }

    for (const breakRegn of this.breakRegnsDisplayed) {
        //create new break
        const breakRegnObj: any = {};
        breakRegnObj.uuid = breakRegn.uuid;
        breakRegn.createdFromDashboard = true; //backend will ignore creation of breakRegn & only update durations if this flag is set
        breakRegnObj.startTimestamp = moment.tz(breakRegn.breakTime, 'HH:mm', TIME_ZONE).toDate();
        breakRegnObj.endTimestamp = moment.tz(breakRegn.endTime, 'HH:mm', TIME_ZONE).toDate();
        breakRegnObj.durationTotal = moment(breakRegnObj.endTimestamp).diff(breakRegnObj.startTimestamp, 'seconds');
        breakRegnObj.creationTimestamp = new Date();
        breakRegnObj.createdByUserId = this.loggedInUserDocData.name ?? null;
        breakRegnObj.updatedTimestamp = new Date();
        //breakRegnObj.workerId = this.workerId ?? null;
        //breakRegnObj.workerName = this.presenceDoc.workerName ?? null;
        //breakRegnObj.workerGroupId = this.presenceDoc.workerGroupId ?? null;
        //breakRegnObj.workerGroupName = this.presenceDoc.workerGroupName ?? null;
        breakRegnObj.isArchived = false;
        breakRegnObj.clientId = this.selectedClientDocData.id;
        breakRegnObj.clientName = this.selectedClientDocData.name ?? null;
        //breakRegnObj.locationId = this.presenceDoc.locationId ?? null;
        //breakRegnObj.locationName = this.presenceDoc.locationName ?? null;
        breakRegnObj.deviceType = 'browser-dashboard';
        breakRegnObj.taskFunction = breakRegn.isPaid ? 'BREAK_PAID' : 'BREAK_UNPAID';
        breakRegnObj.taskType = 'BREAK';
        breakRegnObj.taskName = breakRegn.name ?? null;
    }
  }

  showEndDayRegn() {
    this.endDayTaskRegn.isShown = true;
  }

  showStartDayRegn() {
    this.startDayTaskRegn.isShown = true;
  }


}

