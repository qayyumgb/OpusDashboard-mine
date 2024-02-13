import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {ClientInContextService} from '../../../services/client-in-context.service';
import {AuthService} from '../../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {SNACKBAR_CLASSES} from '../../../common/utils/utils';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-edit-registration-dialog',
  templateUrl: './edit-registration-dialog.component.html',
  styleUrls: ['./edit-registration-dialog.component.scss']
})
export class EditRegistrationDialogComponent implements OnInit, OnDestroy {
  editRegnForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  regnRecordBeingEdited: any;
  allWorkersList: any[];
  workersListSubscription: Subscription;
  allTasksList: any[];
  allLocationsList: any[];
  locationListSubscription: Subscription;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  taskListSubscription: Subscription;
  beingSaved = false;

  oktTheme = {
    container: {
      bodyBackgroundColor: "#424242",
      buttonColor: "#fff"
    },
    dial: {
      dialBackgroundColor: "#555",
      dialEditableActiveColor: "#fff",
      dialEditableBackgroundColor: "#555",
    },
    clockFace: {
      clockFaceBackgroundColor: "#555",
      clockHandColor: "#01806b",
      clockFaceTimeInactiveColor: "#fff"
    }
  };
  private originalRegnDocument: any;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<EditRegistrationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.originalRegnDocument = data.regnRecord.originalRegnDocument;
    this.regnRecordBeingEdited = data.regnRecord;
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

      this.taskListSubscription = this.firestoreService
        .getAllUnarchivedTasksForClientId(this.selectedClientDocData?.id)
        .subscribe((tasksList) => (this.allTasksList = tasksList));
    });

    this.workersListSubscription = this.firestoreService
      .getAllWorkersForClientId(this.selectedClientDocData?.id)
      .subscribe((workerList) => {
        this.allWorkersList = workerList;
      });
    this.locationListSubscription = this.firestoreService
      .getAllLocationsForClientId(this.selectedClientDocData?.id)
      .subscribe((locationsList) => (this.allLocationsList = locationsList));
  }

  ngOnInit() {
    this.editRegnForm = this.fb.group({
      workerId: [{
        value: this.regnRecordBeingEdited.workerId,
        disabled: false
      }, []],
      locationId: [{
        value: this.regnRecordBeingEdited.locationId,
        disabled: false
      }, []],
      startTimestamp: [{
        value: this.regnRecordBeingEdited.startTimestamp,
        disabled: false
      }, []],
      endTimestamp: [{
        value: this.regnRecordBeingEdited.endTimestamp,
        disabled: false
      }, []],
      taskId: [{
        value: this.regnRecordBeingEdited.taskId,
        disabled: false
      }, []]
    });
  }

  async updateRegistration() {
    if (this.editRegnForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    const isOriginal = this.regnRecordBeingEdited.hasOwnProperty('isOriginal') ? this.regnRecordBeingEdited.isOriginal : true;

    this.beingSaved = true;

    const regnDataToUpdate = this.editRegnForm.value;
    //this.dialogRef.close(this.form.value);

    try {

      if (isOriginal) {
        if (this.regnRecordBeingEdited.grandParentCollection === 'presences') {
          regnDataToUpdate.backupDocId = await this.firestoreService.createOriginalVersionCopyOfRegnBelowPresence(this.regnRecordBeingEdited.id, this.selectedClientDocData.id,
            this.regnRecordBeingEdited.parentPresenceId, this.originalRegnDocument);
        } else {
          regnDataToUpdate.backupDocId = await this.firestoreService.createOriginalVersionCopyOfRegn(this.regnRecordBeingEdited.id,
            this.selectedClientDocData.id, this.originalRegnDocument);
        }
        regnDataToUpdate.isOriginal = false;
      }

      if (regnDataToUpdate.startTimestamp) {
        if (regnDataToUpdate.startTimestamp !== this.regnRecordBeingEdited.startTimestamp) {
          const momentStartTs = this.regnRecordBeingEdited.startTs
            ? moment(this.regnRecordBeingEdited.startTs.toMillis()) : this.regnRecordBeingEdited.endTs
              ? moment(this.regnRecordBeingEdited.endTs.toMillis()) : null;
          if (!momentStartTs) {
            regnDataToUpdate.startTimestamp = null;
          } else {
            momentStartTs.set({
              hour: +regnDataToUpdate.startTimestamp.split(':')[0] ?? 0,
              minute: +regnDataToUpdate.startTimestamp.split(':')[1] ?? 0,
            });
            regnDataToUpdate.startTimestamp = momentStartTs.toDate();
          }
        } else {
          regnDataToUpdate.startTimestamp = this.regnRecordBeingEdited.startTs ?? null;
        }
      } else {
        regnDataToUpdate.startTimestamp = null;
      }

      if (regnDataToUpdate.endTimestamp) {
        if (regnDataToUpdate.endTimestamp !== this.regnRecordBeingEdited.endTimestamp) {
          const momentEndTs = this.regnRecordBeingEdited.endTs
            ? moment(this.regnRecordBeingEdited.endTs.toMillis()) : this.regnRecordBeingEdited.startTs
              ? moment(this.regnRecordBeingEdited.startTs.toMillis()) : null;
          if (!momentEndTs) {
            regnDataToUpdate.endTimestamp = null;
          } else {
            momentEndTs.set({
              hour: +regnDataToUpdate.endTimestamp.split(':')[0] ?? 0,
              minute: +regnDataToUpdate.endTimestamp.split(':')[1] ?? 0,
            });
            regnDataToUpdate.endTimestamp = momentEndTs.toDate();
          }
        } else {
          regnDataToUpdate.endTimestamp = this.regnRecordBeingEdited.endTs ?? null;
        }
      } else {
        regnDataToUpdate.endTimestamp = null;
      }

      regnDataToUpdate.id = this.regnRecordBeingEdited.id;

      const momentStartTsToTest = regnDataToUpdate.startTimestamp ?
        moment(regnDataToUpdate.startTimestamp) : this.regnRecordBeingEdited.startTs ? moment(this.regnRecordBeingEdited.startTs.toMillis()) : null;
      const momentEndTsToTest = regnDataToUpdate.endTimestamp ?
        moment(regnDataToUpdate.endTimestamp) : this.regnRecordBeingEdited.endTs ? moment(this.regnRecordBeingEdited.endTs.toMillis()) : null;
      if (momentStartTsToTest && momentEndTsToTest) {
        if (momentStartTsToTest.isSameOrAfter(momentEndTsToTest)) {
          this.openSnackBar('End timestamp should be after start timestamp!', 'error');
          this.beingSaved = false;
          return;
        }
      }

      if (regnDataToUpdate.workerId) {
        if (regnDataToUpdate.workerId !== this.regnRecordBeingEdited.workerId) {
          regnDataToUpdate.workerName = this.allWorkersList
            .filter((worker) => worker.id === regnDataToUpdate.workerId)
            .map((worker) => (worker.name ? worker.name : null))[0];
        }
      } else {
        regnDataToUpdate.workerName = null;
      }


      if (regnDataToUpdate.taskId) {
        if (regnDataToUpdate.taskId !== this.regnRecordBeingEdited.taskId) {
          regnDataToUpdate.taskName = this.allTasksList
            .filter((task) => task.id === regnDataToUpdate.taskId)
            .map((task) => (task.name ? task.name : null))[0];
        }
      } else {
        regnDataToUpdate.taskName = null;
      }

      if (regnDataToUpdate.locationId) {
        if (regnDataToUpdate.locationId !== this.regnRecordBeingEdited.locationId) {
          regnDataToUpdate.locationName = this.allLocationsList
            .filter((location) => location.id === regnDataToUpdate.locationId)
            .map((location) => (location.name ? location.name : null))[0];
        }
      } else {
        regnDataToUpdate.locationName = null;
      }

      regnDataToUpdate.updatedByUserId = this.loggedInUserDocData.id ?? null;
      regnDataToUpdate.updatedByUserName = this.loggedInUserDocData.name ?? null;

      if (this.regnRecordBeingEdited.grandParentCollection === 'presences') {
        await this.firestoreService.updateRegnBelowPresenceForClientId(regnDataToUpdate, this.selectedClientDocData.id, this.regnRecordBeingEdited.parentPresenceId);
      } else {
        await this.firestoreService.updateRegnForClientId(regnDataToUpdate, this.selectedClientDocData.id);
      }
      this.openSnackBar('Changes have been saved', 'success');
      this.editRegnForm.markAsPristine();
      this.dialogRef.close();
      this.beingSaved = false;
    } catch (error) {
      this.beingSaved = false;
      this.openSnackBar('Error in saving changes:' + error.message, 'error');
      console.log(error.message);
    }
  }

  close() {
    this.dialogRef.close();
  }

  async revertChanges() {
    if (this.regnRecordBeingEdited.hasOwnProperty('isOriginal') && this.regnRecordBeingEdited.isOriginal) {
      return;
    }
    if (this.regnRecordBeingEdited.grandParentCollection === 'presences') {
      await this.firestoreService.restoreRegnFromVersionBackupBelowPresence(this.regnRecordBeingEdited.id,
        this.selectedClientDocData.id, this.regnRecordBeingEdited.parentPresenceId, this.originalRegnDocument.backupDocId, this.loggedInUserDocData);
    } else {
      await this.firestoreService.restoreRegnFromVersionBackup(this.regnRecordBeingEdited.id,
        this.selectedClientDocData.id, this.originalRegnDocument.backupDocId, this.loggedInUserDocData);
    }
    this.openSnackBar('Session has been reverted to original values', 'success');
    this.dialogRef.close();
  }


  ngOnDestroy(): void {
    this.workersListSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.taskListSubscription?.unsubscribe();
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  //Note - Below function will not be needed when this issue is fixed https://github.com/Agranom/ngx-material-timepicker/issues/453
  timeChanged(event) {
    const a = event.split(' ')[0].split(':');
    //console.log(document.getElementsByClassName('timepicker-dial__control'), a);
    const hourElemnt = (((
      document.getElementsByClassName('timepicker-dial__control')[0] as HTMLInputElement
    )).value = ('0' + a[0]).slice(-2));
    ((
      document.getElementsByClassName('timepicker-dial__control')[1] as HTMLInputElement
    )).value = a[1];
  }

}

