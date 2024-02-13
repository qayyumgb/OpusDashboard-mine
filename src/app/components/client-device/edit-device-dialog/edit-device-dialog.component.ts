import {Component, Inject, OnDestroy, OnInit, ChangeDetectorRef} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {AuthService} from '../../../services/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClientInContextService} from "../../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-edit-device-dialog',
  templateUrl: './edit-device-dialog.component.html',
  styleUrls: ['./edit-device-dialog.component.scss'],
})
export class EditDeviceDialogComponent implements OnInit, OnDestroy {
  editDeviceForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  private deviceRecordBeingEdited: any;
  allActivitiesList: any[];
  private activityListSubscription: Subscription;
  allLocationsList: any[];
  allAppModesList: any[];
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  locationListSubscription: Subscription;
  appModesSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<EditDeviceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.deviceRecordBeingEdited = data.deviceRecord;
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

      this.appModesSubscription = this.firestoreService.getAllAppModes().subscribe(appModesList => (this.allAppModesList = appModesList));

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => (this.allLocationsList = locationsList));

    });

    this.activityListSubscription = this.firestoreService
      .getAllActivities()
      .subscribe((activityList) => {
        this.allActivitiesList = activityList;
      });
  }

  ngOnInit() {
    this.editDeviceForm = this.fb.group({
      locationId: [{
        value: this.deviceRecordBeingEdited.locationId,
        disabled: !this.selectedClientDocData.hasAdminRole
      }, []],
      notes: [{value: this.deviceRecordBeingEdited.notes, disabled: !this.selectedClientDocData.hasAdminRole}, []],
      deviceNumber: [{
        value: this.deviceRecordBeingEdited.deviceNumber,
        disabled: !this.selectedClientDocData.hasAdminRole
      }, []],
      enableAutoTouchLock: [{value: this.deviceRecordBeingEdited.enableAutoTouchLock, disabled: false}, []],
      enableGPS: [{value: this.deviceRecordBeingEdited.enableGPS, disabled: false}, []],
      enableOutOfRange: [{value: this.deviceRecordBeingEdited.enableOutOfRange, disabled: false}, []],
      enableTrainingMode: [{value: this.deviceRecordBeingEdited.enableTrainingMode, disabled: false}, []],
      enableVoiceAssistance: [{value: this.deviceRecordBeingEdited.enableVoiceAssistance, disabled: false}, []],
      appModes: [{
        value: this.deviceRecordBeingEdited.appModes ? Object.keys(this.deviceRecordBeingEdited.appModes) : [],
        disabled: false
      }, []],
    });
  }

  async updateDevice() {
    if (this.editDeviceForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editDeviceForm.value.appModes.length === 0) {
      this.openSnackBar('At least 1 app mode has to be selected', 'error');
      return;
    }

    if (this.editDeviceForm?.value?.deviceNumber && (!/^\d{0,8}$/.test(this.editDeviceForm?.value?.deviceNumber))) {
      this.openSnackBar('Please enter only digits for device number!', 'error');
      return;
    }

    const deviceDataToUpdate = this.editDeviceForm.value;
    //this.dialogRef.close(this.form.value);
    try {
      deviceDataToUpdate.id = this.deviceRecordBeingEdited.id;

      if (!deviceDataToUpdate.notes) {
        deviceDataToUpdate.notes = null;
      }

      const appModesToSave: any = {};
      deviceDataToUpdate.appModeIds = this.editDeviceForm.value.appModes;
      this.editDeviceForm.value.appModes.forEach(appMode => {
        if (appMode !== 'SCOUTING_ADVANCED') {
          appModesToSave[appMode] = {name: this.allAppModesList.filter(mode => mode.id === appMode)[0].name};
        } else {
          appModesToSave[appMode] = {
            name: this.allAppModesList.filter(mode => mode.id === appMode)[0].name,
            options: this.allAppModesList.filter(mode => mode.id === appMode)[0].options ?? []
          };
        }
      });
      deviceDataToUpdate.appModes = appModesToSave;

      if (this.selectedClientDocData.hasAdminRole) {
        if (deviceDataToUpdate.locationId) {
          deviceDataToUpdate.locationName = this.allLocationsList
            .filter((location) => location.id === deviceDataToUpdate.locationId)
            .map((location) => (location.name ? location.name : null))[0];
        } else {
          deviceDataToUpdate.locationName = null;
          deviceDataToUpdate.locationId = null;
        }
        await this.firestoreService.updateDevice(deviceDataToUpdate, false);
      }

      this.openSnackBar('Changes have been saved', 'success');
      this.editDeviceForm.markAsPristine();
      this.dialogRef.close();
    } catch (error) {
      this.openSnackBar('Error in saving changes:' + error.message, 'error');
      console.log(error.message);
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.activityListSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.appModesSubscription?.unsubscribe();
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
}
