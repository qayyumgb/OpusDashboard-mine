import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-multiple-device-edit-dialog',
  templateUrl: './multiple-device-edit.component.html',
  styleUrls: ['./multiple-device-edit.component.scss']
})
export class MultipleDeviceEditComponent implements OnInit, OnDestroy {
  multipleDeviceEditForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  private deviceIds: any;
  allLocationsList: any[];
  allAppModesList: any[];
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  locationListSubscription: Subscription;
  appModesSubscription: Subscription;
  beingSaved = false;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<MultipleDeviceEditComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.deviceIds = data.selectedDeviceIds;
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
  }

  ngOnInit() {
    this.multipleDeviceEditForm = this.fb.group({
      locationId: [{
        value: '',
        disabled: false
      }, []],
      enableAutoTouchLock: [{value: false, disabled: false}, []],
      enableGPS: [{value: false, disabled: false}, []],
      enableOutOfRange: [{value: false, disabled: false}, []],
      enableTrainingMode: [{value: false, disabled: false}, []],
      enableVoiceAssistance: [{value: false, disabled: false}, []],
      appModes: [['HARVEST_SMART', 'TASKS', 'SCOUTING_LITE', 'SCOUTING_ADVANCED'], []],
    });
  }

  async updateDevices() {
    if (this.multipleDeviceEditForm.value.appModes.length === 0) {
      this.openSnackBar('At least 1 app mode has to be selected', 'error');
      return;
    }
    const devicesDataToUpdate = this.multipleDeviceEditForm.value;
    //this.dialogRef.close(this.form.value);
    if (devicesDataToUpdate.locationId) {
      console.log(`Update location: ${devicesDataToUpdate.locationId}`);
      devicesDataToUpdate.locationName = this.allLocationsList
        .filter((location) => location.id === devicesDataToUpdate.locationId)
        .map((location) => (location.name ? location.name : null))[0];
    } else {
      devicesDataToUpdate.locationName = null;
      devicesDataToUpdate.locationId = null;
    }
    const appModesToSave: any = {};
    devicesDataToUpdate.appModeIds = this.multipleDeviceEditForm.value.appModes;
    this.multipleDeviceEditForm.value.appModes.forEach(appMode => {
      if (appMode !== 'SCOUTING_ADVANCED') {
        appModesToSave[appMode] = {name: this.allAppModesList.filter(mode => mode.id === appMode)[0].name};
      } else {
        appModesToSave[appMode] = {
          name: this.allAppModesList.filter(mode => mode.id === appMode)[0].name,
          options: this.allAppModesList.filter(mode => mode.id === appMode)[0].options ?? []
        };
      }
    });
    devicesDataToUpdate.appModes = appModesToSave;
    this.beingSaved = true;
    this.multipleDeviceEditForm.disable();
    this.firestoreService.updateDevices(this.deviceIds, devicesDataToUpdate)
      .subscribe({
        next: async (apiResponse) => {
          this.beingSaved = false;
          this.multipleDeviceEditForm.enable();
          if (apiResponse.success) {
            this.openSnackBar('Changes have been saved', 'success');
            this.dialogRef.close();
          } else if (apiResponse.success === false) {
            this.openSnackBar('Error in savings device settings:' + apiResponse.error, 'error');
          }
        },
        error: (error) => {
          this.beingSaved = false;
          this.multipleDeviceEditForm.disable();
          this.openSnackBar('Error in saving device settings:' + error.message, 'error');
          console.log(error.message);
        }
      });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
    this.appModesSubscription?.unsubscribe();
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
