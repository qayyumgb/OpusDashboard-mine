import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../../services/firestore.service';
import {ClientInContextService} from '../../../../services/client-in-context.service';
import {AuthService} from '../../../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import * as moment from 'moment-timezone';
import {SNACKBAR_CLASSES} from '../../../../common/utils/utils';
import {ConfirmationDialogComponent} from '../../../utility/confirmation-dialog/confirmation-dialog.component';
import {TIME_FORMAT, TIME_ZONE} from '../../../../common/utils/time-utils';
import {v4 as uuidv4} from 'uuid';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-edit-presence-dialog',
  templateUrl: './edit-presence-dialog.component.html',
  styleUrls: ['./edit-presence-dialog.component.scss']
})
export class EditPresenceDialogComponent implements OnInit, OnDestroy {
  presenceLocationId: string;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  presenceDoc: any;
  breakRegns: any[] = [];
  breakRegnsDisplayed: any[] = [];
  originalPresenceDocument: any;
  allWorkersList: any[];
  workersListSubscription: Subscription;
  allTasksList: any[];
  allLocationsList: any[];
  locationListSubscription: Subscription;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  regnsSubscription: Subscription;
  beingSaved = false;
  startDayTaskRegn: any;
  endDayTaskRegn: any;
  taskRegnsOriginalList: any[];
  presenceListingRecord: any;
  @ViewChild('editPresenceform') public editForm: NgForm;


  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditPresenceDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.presenceDoc = data.presenceRecord.presenceDoc;
    this.presenceLocationId = this.presenceDoc.locationId ?? null;
    this.presenceListingRecord = data.presenceRecord;
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

      this.regnsSubscription = this.firestoreService
        .getAllUnarchivedTaskRegnsForPresence(this.presenceDoc)
        .subscribe((taskRegns) => {
          this.taskRegnsOriginalList = taskRegns;
          let startDayTaskRegns = taskRegns.filter(taskRegn => (taskRegn.taskFunction === 'START_DAY') && !taskRegn.isRejected);

          if (startDayTaskRegns.length > 0) {
            // @ts-ignore
            startDayTaskRegns = startDayTaskRegns.sort((regnA: any, regnB: any) => moment(regnA.timestamp.toDate()) - moment(regnB.timestamp.toDate()));
            this.startDayTaskRegn = startDayTaskRegns[0];
            this.startDayTaskRegn.startTime = moment(this.startDayTaskRegn.timestamp.toDate()).tz(TIME_ZONE).format('HH:mm');
            this.startDayTaskRegn.isShown = true;
          } else {
            this.startDayTaskRegn = {
              id: null,
              isShown: false,
              locatonId: null,
              endTime: null,
            };
          }
          const endDayTaskRegns = taskRegns.filter(taskRegn => taskRegn.taskFunction === 'END_DAY');
          if (endDayTaskRegns.length > 0) {
            this.endDayTaskRegn = endDayTaskRegns[0];
            this.endDayTaskRegn.endTime = moment(this.endDayTaskRegn.timestamp.toDate()).tz(TIME_ZONE).format('HH:mm');
            this.endDayTaskRegn.isShown = true;
          } else {
            this.endDayTaskRegn = {
              id: null,
              isShown: false,
              locatonId: null,
              endTime: null,
            };
          }
          this.breakRegns = taskRegns.filter(task => task.taskType === 'BREAK');//TODO - Sort by startTimestamp asc
          this.breakRegnsDisplayed = this.breakRegns.map(breakRegn => {
            return {
              ...breakRegn,
              isDeleted: false,
              startTime: moment(breakRegn.startTimestamp.toDate()).tz(TIME_ZONE).format('HH:mm'),
              endTime: moment(breakRegn.endTimestamp.toDate()).tz(TIME_ZONE).format('HH:mm'),
              isPaid: !!breakRegn.taskFunction?.endsWith('_PAID')
            }
          })
          //console.log(JSON.stringify(this.breakRegns, null, 2));
        });
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
    this.locationListSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.regnsSubscription?.unsubscribe();
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }


  async archivePresenceNRegns() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive this presence ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        }
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.archiveAllTaskRegnsNPresence(this.taskRegnsOriginalList, this.presenceDoc.id, this.presenceDoc.clientId);
          this.openSnackBar(`Presence and it's registrations archived successfully`, 'error');
          this.dialogRef.close();
        } catch (error) {
          this.openSnackBar('Error in presence archival: ' + error.message, 'error');
          console.log(error.message);
        }
      }
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

  async savePresenceNRegistrations() {
    this.beingSaved = true;
    console.log(JSON.stringify(this.editForm.valid));
    if (!this.editForm.valid) {
      this.beingSaved = false;
      this.openSnackBar('Please fill all mandatory fields', 'error');
      return;
    }

    try {
      if (this.startDayTaskRegn) {
        //Update startDayRegn - TODO
      }
      for (const breakRegn of this.breakRegnsDisplayed) {
        if (breakRegn.isDeleted) {
          await this.firestoreService.deleteRegn(breakRegn.id, this.presenceDoc.id, this.selectedClientDocData.id);
          continue;
        }
        if (breakRegn.uuid && !breakRegn.id) {
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
          breakRegnObj.workerId = this.presenceDoc.workerId ?? null;
          breakRegnObj.workerName = this.presenceDoc.workerName ?? null;
          breakRegnObj.workerGroupId = this.presenceDoc.workerGroupId ?? null;
          breakRegnObj.workerGroupName = this.presenceDoc.workerGroupName ?? null;
          breakRegnObj.isArchived = false;
          breakRegnObj.clientId = this.presenceDoc.clientId;
          breakRegnObj.clientName = this.selectedClientDocData.name ?? null;
          breakRegnObj.locationId = this.presenceDoc.locationId ?? null;
          breakRegnObj.locationName = this.presenceDoc.locationName ?? null;
          breakRegnObj.deviceType = this.presenceDoc.deviceType;
          breakRegnObj.deviceType = this.presenceDoc.deviceType;
          breakRegnObj.taskFunction = breakRegn.isPaid ? 'BREAK_PAID' : 'BREAK_UNPAID';
          breakRegnObj.taskType = 'BREAK';
          breakRegnObj.taskName = breakRegn.name ?? null;
        }

        if (breakRegn.id) {
          //updateBreakRegn - TODO
          await this.firestoreService.updateRegnBelowPresenceForClientId(breakRegn, this.selectedClientDocData.id, this.presenceDoc.parentPresenceId);
        }
      }
      if (this.endDayTaskRegn && this.endDayTaskRegn.isShown) {
        if (this.endDayTaskRegn.id) {
          //update endDayTaskRegnPIT  - TODO
        } else {
          //create endDayTaskRegnPIT  - TODO
        }
      }
      this.openSnackBar('Changes have been saved', 'success');
      this.dialogRef.close();
      this.beingSaved = false;
    } catch (error) {
      this.beingSaved = false;
      this.openSnackBar('Error in saving changes:' + error.message, 'error');
      console.log(error.message);
    }
  }

  showEndDayRegn() {
    this.endDayTaskRegn.isShown = true;
  }

  showStartDayRegn() {
    this.startDayTaskRegn.isShown = true;
  }

}
