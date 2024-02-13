import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";
import {ThemePalette} from "@angular/material/core";
import * as moment from 'moment';

@Component({
  selector: 'app-create-session-dialog',
  templateUrl: './create-session-dialog.component.html',
  styleUrls: ['./create-session-dialog.component.scss']
})
export class CreateSessionDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  allLocationsList: any[];
  allRowsList: any[];
  allWorkersList: any[];
  allVarietiesList: any[];
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  locationListSubscription: Subscription;


  //public date: moment.Moment;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = true;
  public touchUi = false;
  public enableMeridian = false;
  public minDate: moment.Moment;
  public maxDate: moment.Moment;
  public stepHour = 1;
  public stepMinute = 1;
  public stepSecond = 1;
  public color: ThemePalette = 'primary';

  public options = [
    {value: true, label: 'True'},
    {value: false, label: 'False'}
  ];

  public listColors = ['primary', 'accent', 'warn'];

  public stepHours = [1, 2, 3, 4, 5];
  public stepMinutes = [1, 5, 10, 15, 20, 25];
  public stepSeconds = [1, 5, 10, 15, 20, 25];
  workerListSubscription: Subscription;
  rowListSubscription: Subscription;
  varietyListSubscription: Subscription;
  mappedRowsList: any[];
  locationSelected = false;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateSessionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(userDocData => {
      this.loggedInUserDocData = userDocData;
    });

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }

      this.selectedClientDocData = selectedClientDocData;

      this.workerListSubscription = this.firestoreService
        .getUnArchivedWorkersForClientId(this.selectedClientDocData?.id)
        .subscribe((workersList) => {
          this.allWorkersList = workersList.sort((workerA: any, workerB: any) => {
            return workerA.name.toLowerCase() < workerB.name.toLowerCase() ? -1 : workerA.name.toLowerCase() > workerB.name.toLowerCase() ? 1 : 0;
          });
        });

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => {
          this.allLocationsList = locationsList.sort((locA: any, locB: any) => {
            return locA.name.toLowerCase() < locB.name.toLowerCase() ? -1 : locA.name.toLowerCase() > locB.name.toLowerCase() ? 1 : 0;
          });
        });

    });
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
    this.rowListSubscription?.unsubscribe();
    this.workerListSubscription?.unsubscribe();
    this.varietyListSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.form = this.fb.group({
      count: [null, []],
      trolleyId: [null, []],
      workerId: [null, []],
      locationId: [null, []],
      rowId: [{value: null, disabled: true}, []],
      startTimestamp: [moment(), [Validators.required]],
      endTimestamp: [moment(), []],
    });
  }

  onLocationChange() {
    if (this.form.value.locationId) {
      this.locationSelected = true;
      this.rowListSubscription = this.firestoreService
        .getAllRowsForLocIdForClientId(this.selectedClientDocData?.id, this.form.value.locationId)
        .subscribe((rowsList) => {
          this.form.patchValue({
            rowId: null,
          });
          this.form.controls.rowId.enable();
          this.allRowsList = rowsList;
          this.mappedRowsList = rowsList.map(row => {
            return {
              ...row,
              name: `${row.rowNumber} (${row.varietyName})`
            }
          });
          this.mappedRowsList = this.mappedRowsList.sort((rowA: any, rowB: any) => {
            return +rowA.rowNumber < +rowB.rowNumber ? -1 : +rowA.rowNumber > +rowB.rowNumber ? 1 : 0;
          });
        });
    } else {
      this.locationSelected = false;
      this.form.patchValue({
        rowId: null,
      });
      this.allRowsList = [];
      this.mappedRowsList = [];
    }
  }

  async createSession() {
    const sessionToCreate = this.form.value;
    if (!sessionToCreate.startTimestamp) {
      this.openSnackBar('Start Time is required', 'error');
      return;
    }

    if (sessionToCreate.locationId) {
      sessionToCreate.locationName = this.allLocationsList
        .filter((location) => location.id === sessionToCreate.locationId)
        .map((location) => (location.name ? location.name : null))[0];
    } else {
      sessionToCreate.locationName = null;
    }

    if (sessionToCreate.count) {
      sessionToCreate.count = +sessionToCreate.count;
    } else {
      sessionToCreate.count = 0;
    }

    if (sessionToCreate.workerId) {
      sessionToCreate.workerName = this.allWorkersList
        .filter((worker) => worker.id === sessionToCreate.workerId)
        .map((worker) => (worker.name ? worker.name : null))[0];
    } else {
      sessionToCreate.workerName = null;
    }

    if (sessionToCreate.rowId) {
      const rowRecord = this.allRowsList
        .filter((row) => row.id === sessionToCreate.rowId)[0];
      sessionToCreate.rowNumber = rowRecord.rowNumber ?? null;
      sessionToCreate.layoutId = rowRecord.layoutId ?? null;
      sessionToCreate.layoutName = rowRecord.layoutName ?? null;
      sessionToCreate.labels = rowRecord.labels ?? [];
      sessionToCreate.labelIds = rowRecord.labelIds ?? [];
      sessionToCreate.varietyId = rowRecord.varietyId ?? null;
      sessionToCreate.varietyName = rowRecord.varietyName ?? null;
      sessionToCreate.activityId = rowRecord.activityId ?? null;
      sessionToCreate.activityName = rowRecord.activityName ?? null;
    } else {
      sessionToCreate.rowNumber = null;
      sessionToCreate.layoutId = null;
      sessionToCreate.layoutName = null;
      sessionToCreate.labels = [];
      sessionToCreate.labelIds = [];
      sessionToCreate.varietyId = null;
      sessionToCreate.varietyName = null;
      sessionToCreate.activityId = null;
      sessionToCreate.activityName = null;
    }

    sessionToCreate.clientId = this.selectedClientDocData.id;
    sessionToCreate.clientName = this.selectedClientDocData.name;
    sessionToCreate.creationTimestamp = new Date();

    if (sessionToCreate.startTimestamp && sessionToCreate.endTimestamp && sessionToCreate.count) {
      sessionToCreate.performanceRatio = 1;
      const time = (sessionToCreate.endTimestamp.valueOf() - sessionToCreate.startTimestamp.valueOf()) / (3600000);
      sessionToCreate.grossPerformance = +(+sessionToCreate.count / time).toFixed(0);
      sessionToCreate.nettPerformance = +(+sessionToCreate.count / time).toFixed(0);
    }

    if (sessionToCreate.startTimestamp) {
      sessionToCreate.startTimestamp = new Date(sessionToCreate.startTimestamp);
      sessionToCreate.nettStartTimestamp = sessionToCreate.startTimestamp;
    } else {
      sessionToCreate.startTimestamp = null;
      sessionToCreate.nettStartTimestamp = null;
    }

    if (sessionToCreate.endTimestamp) {
      sessionToCreate.endTimestamp = new Date(sessionToCreate.endTimestamp);
      sessionToCreate.nettEndTimestamp = sessionToCreate.endTimestamp;
    } else {
      sessionToCreate.endTimestamp = null;
      sessionToCreate.nettEndTimestamp = null;
    }

    sessionToCreate.isManual = true;
    sessionToCreate.isArchived = false;

    sessionToCreate.createdByUserId = this.loggedInUserDocData.id ?? null;
    sessionToCreate.createdByUserName = this.loggedInUserDocData.name ?? null;

    try {
      await this.firestoreService.createSessionForClientId(sessionToCreate, this.selectedClientDocData.id);
      this.dialogRef.close(this.form.value);
      this.openSnackBar(`Session created successfully.`, 'success');
      this.form.reset();
    } catch (error) {
      this.openSnackBar('Error in session creation:' + error.message, 'error');
      console.log(error.message);
    }
  }

  close() {
    this.dialogRef.close();
  }

  openSnackBar(message: string, type: string) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}

