import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {ClientInContextService} from '../../../services/client-in-context.service';
import {AuthService} from '../../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {SNACKBAR_CLASSES} from '../../../common/utils/utils';
import {ThemePalette} from '@angular/material/core';
import * as moment from 'moment';

@Component({
  selector: 'app-edit-session-dialog',
  templateUrl: './edit-session-dialog.component.html',
  styleUrls: ['./edit-session-dialog.component.scss']
})
export class EditSessionDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  originalSession: any;
  allLocationsList: any[];
  allRowsList: any[];
  allWorkersList: any[];
  allVarietiesList: any[];
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  locationListSubscription: Subscription;
  beingSaved = false;

  public date: moment.Moment;
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
  private readonly originalSessionDocument: any;


  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditSessionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.originalSession = data.sessionRecord;
    this.originalSessionDocument = data.sessionRecord.originalSessionDocument;
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(userDocData => {
      this.loggedInUserDocData = userDocData;
    });

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }

      //TODO -- manually feed archived selected entries in lists

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

      if (this.originalSession.locationId) {
        this.loadRowsForLocation(this.originalSession.locationId);
      }
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      count: [this.originalSessionDocument.count, []],
      trolleyId: [this.originalSessionDocument.trolleyId, []],
      workerId: [this.originalSessionDocument.workerId, []],
      locationId: [this.originalSessionDocument.locationId, []],
      rowId: [this.originalSessionDocument.rowId, []],
      startTimestamp: [moment(this.originalSession.startTs?.toDate()), []],
      endTimestamp: [this.originalSession.endTs ? moment(this.originalSession.endTs?.toDate()) : null, []],
    });
  }

  async updateSession() {

    if (this.form.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    const isOriginal = this.originalSession.hasOwnProperty('isOriginal') ? this.originalSession.isOriginal : true;
    const isManual = this.originalSession.hasOwnProperty('isManual') ? this.originalSession.isManual : false;

    const sessionToUpdate = this.form.value;
    if (isOriginal && !isManual) {
      sessionToUpdate.backupDocId = await this.firestoreService.createOriginalVersionCopyOfSession(this.originalSession.sessionId,
        this.selectedClientDocData.id, this.originalSessionDocument);
      sessionToUpdate.isOriginal = false;
    }

    if (!sessionToUpdate.startTimestamp) {
      this.openSnackBar('Start Time is required', 'error');
      return;
    }

    if (sessionToUpdate.locationId) {
      if (sessionToUpdate.locationId !== this.originalSession.locationId) {
        sessionToUpdate.locationName = this.allLocationsList
          .filter((location) => location.id === sessionToUpdate.locationId)
          .map((location) => (location.name ? location.name : null))[0];
      }
    } else {
      sessionToUpdate.locationName = null;
    }

    if (sessionToUpdate.count) {
      sessionToUpdate.count = +sessionToUpdate.count;
    } else {
      sessionToUpdate.count = 0;
    }

    if (sessionToUpdate.workerId) {
      if (sessionToUpdate.workerId !== this.originalSession.workerId) {
        sessionToUpdate.workerName = this.allWorkersList
          .filter((worker) => worker.id === sessionToUpdate.workerId)
          .map((worker) => (worker.name ? worker.name : null))[0];
      }
    } else {
      sessionToUpdate.workerName = null;
    }

    if (sessionToUpdate.rowId) {
      if (sessionToUpdate.rowId !== this.originalSession.rowId) {
        const rowRecord = this.allRowsList
          .filter((row) => row.id === sessionToUpdate.rowId)[0];
        sessionToUpdate.rowNumber = rowRecord.rowNumber ?? null;
        sessionToUpdate.layoutId = rowRecord.layoutId ?? null;
        sessionToUpdate.layoutName = rowRecord.layoutName ?? null;
        sessionToUpdate.labels = rowRecord.labels ?? [];
        sessionToUpdate.labelIds = rowRecord.labelIds ?? [];
        sessionToUpdate.varietyId = rowRecord.varietyId ?? null;
        sessionToUpdate.varietyName = rowRecord.varietyName ?? null;
        sessionToUpdate.activityId = rowRecord.activityId ?? null;
        sessionToUpdate.activityName = rowRecord.activityName ?? null;
      }
    } else {
      sessionToUpdate.rowNumber = null;
      sessionToUpdate.layoutId = null;
      sessionToUpdate.layoutName = null;
      sessionToUpdate.labels = [];
      sessionToUpdate.labelIds = [];
      sessionToUpdate.varietyId = null;
      sessionToUpdate.varietyName = null;
      sessionToUpdate.activityId = null;
      sessionToUpdate.activityName = null;
    }

    let toUpdateTimestamp = false;
    if (isManual) {
      if (sessionToUpdate.startTimestamp) {
        sessionToUpdate.startTimestamp = new Date(sessionToUpdate.startTimestamp);
        sessionToUpdate.nettStartTimestamp = sessionToUpdate.startTimestamp;
      } else {
        sessionToUpdate.startTimestamp = null;
        sessionToUpdate.nettStartTimestamp = null;
      }

      if (sessionToUpdate.endTimestamp) {
        sessionToUpdate.endTimestamp = new Date(sessionToUpdate.endTimestamp);
        sessionToUpdate.nettEndTimestamp = sessionToUpdate.endTimestamp;
      } else {
        sessionToUpdate.endTimestamp = null;
        sessionToUpdate.nettEndTimestamp = null;
      }

      if (sessionToUpdate.startTimestamp && sessionToUpdate.endTimestamp && sessionToUpdate.count) {
        sessionToUpdate.performanceRatio = 1;
        const time = (sessionToUpdate.endTimestamp.valueOf() - sessionToUpdate.startTimestamp.valueOf()) / (3600000);
        sessionToUpdate.grossPerformance = +(+sessionToUpdate.count / time).toFixed(0);
        sessionToUpdate.nettPerformance = +(+sessionToUpdate.count / time).toFixed(0);
      }
    } else {
      if (sessionToUpdate.startTimestamp) {
        sessionToUpdate.startTimestamp = new Date(sessionToUpdate.startTimestamp);
      } else {
        sessionToUpdate.startTimestamp = null;
      }

      if (sessionToUpdate.endTimestamp) {
        sessionToUpdate.endTimestamp = new Date(sessionToUpdate.endTimestamp);
      } else {
        sessionToUpdate.endTimestamp = null;
      }

      if ((sessionToUpdate.count !== this.originalSessionDocument.count) && (sessionToUpdate.count)) {
        if (sessionToUpdate.startTimestamp && sessionToUpdate.endTimestamp
          && this.originalSessionDocument.nettStartTimestamp && this.originalSessionDocument.nettEndTimestamp && sessionToUpdate.count) {
          const grossTime = (sessionToUpdate.endTimestamp.valueOf() - sessionToUpdate.startTimestamp.valueOf()) / (3600000);
          const nettTime = (this.originalSessionDocument.nettEndTimestamp.toMillis() - this.originalSessionDocument.nettStartTimestamp.toMillis()) / (3600000);
          sessionToUpdate.grossPerformance = +(+sessionToUpdate.count / grossTime).toFixed(0);
          sessionToUpdate.nettPerformance = +(+sessionToUpdate.count / nettTime).toFixed(0);
          sessionToUpdate.performanceRatio = sessionToUpdate.grossPerformance / sessionToUpdate.nettPerformance;
        }
      } else if (sessionToUpdate.count === this.originalSessionDocument.count) {
        toUpdateTimestamp = true;
      }
    }

    sessionToUpdate.updatedByUserId = this.loggedInUserDocData.id ?? null;
    sessionToUpdate.updatedByUserName = this.loggedInUserDocData.name ?? null;

    try {
      sessionToUpdate.id = this.originalSession.sessionId;
      await this.firestoreService.updateSessionForClientId(sessionToUpdate, this.selectedClientDocData.id, toUpdateTimestamp);
      this.openSnackBar('Changes have been saved', 'success');
      this.form.markAsPristine();
      this.dialogRef.close({data: {id: sessionToUpdate.id}});
    } catch (error) {
      this.openSnackBar('Error in saving changes:' + error.message, 'error');
      console.log(error.message);
    }
  }

  close() {
    this.dialogRef.close({data: {id: null}});
  }

  onLocationChange() {
    if (this.form.value.locationId) {
      this.loadRowsForLocation(this.form.value.locationId);
      this.form.patchValue({
        rowId: null,
      });
    } else {
      this.allRowsList = [];
      this.mappedRowsList = [];
      this.form.patchValue({
        rowId: null,
      });
    }
  }

  loadRowsForLocation(locationId: string) {
    this.rowListSubscription = this.firestoreService
      .getAllRowsForLocIdForClientId(this.selectedClientDocData?.id, locationId)
      .subscribe((rowsList) => {
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
  }

  async revertSession() {
    if (this.originalSession.hasOwnProperty('isOriginal') && !this.originalSession) {
      return;
    }
    await this.firestoreService.restoreSessionFromVersionBackup(this.originalSession.sessionId, this.selectedClientDocData.id,
      this.originalSessionDocument.backupDocId, this.loggedInUserDocData);
    this.openSnackBar('Session has been reverted to original values', 'success');
    this.dialogRef.close({data: {id: this.originalSession.sessionId}});
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
    this.rowListSubscription?.unsubscribe();
    this.workerListSubscription?.unsubscribe();
    this.varietyListSubscription?.unsubscribe();
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
