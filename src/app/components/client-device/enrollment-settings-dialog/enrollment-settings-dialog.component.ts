import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-enrollment-settings-dialog',
  templateUrl: './enrollment-settings-dialog.component.html',
  styleUrls: ['./enrollment-settings-dialog.component.scss']
})
export class EnrollmentSettingsDialogComponent implements OnInit, OnDestroy {
  enrollmentSettingsForm: UntypedFormGroup = this.fb.group({
    locationId: [{value: '', disabled: false}, []],
    nextDeviceNumber: [{value: '', disabled: false}, [Validators.pattern(/^[0-9]{4}$/), Validators.required]],
    enableAutoTouchLock: [{value: false, disabled: false}, []],
    enableGPS: [{value: false, disabled: false}, []],
    enableOutOfRange: [{value: false, disabled: false}, []],
    enableTrainingMode: [{value: false, disabled: false}, []],
    enableVoiceAssistance: [{value: false, disabled: false}, []],
    appModes: [[], [Validators.required]],
  });
  currentSettings: any = null;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  private deviceIds: any;
  allLocationsList: any[];
  allAppModesList: any[];
  selectedClientDocData: any;
  clientSubscription: Subscription;
  locationListSubscription: Subscription;
  appModesSubscription: Subscription;
  beingSaved = false;

  constructor(
    private firestoreService: FirestoreService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<EnrollmentSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.deviceIds = data.selectedDeviceIds;
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );

      this.selectedClientDocData = data.selectedClientDocData;
      this.clientSubscription = this.firestoreService.getClientById(this.selectedClientDocData.id).subscribe(client => {
        if (client.enrollmentSettings) {
          this.currentSettings = {
            ...client.enrollmentSettings,
            appModes: client.enrollmentSettings.appModes ? Object.keys(client.enrollmentSettings.appModes) : []
          }
        } else {
          this.currentSettings = {
            locationId: '',
            appModes: [],
            nextDeviceNumber: '',
            enableAutoTouchLock: false,
            enableGPS: false,
            enableOutOfRange: false,
            enableTrainingMode: false,
            enableVoiceAssistance: false
          };
        }
        this.enrollmentSettingsForm = this.fb.group({
          locationId: [{value: this.currentSettings.locationId ?? null, disabled: false}, []],
          nextDeviceNumber: [{value: this.currentSettings.nextDeviceNumber ?? '0000', disabled: false}
            , [Validators.pattern(/^[0-9]{4}$/), Validators.required]],
          enableAutoTouchLock: [{value: this.currentSettings.enableAutoTouchLock ?? false, disabled: false}, []],
          enableGPS: [{value: this.currentSettings.enableGPS ?? false, disabled: false}, []],
          enableOutOfRange: [{value: this.currentSettings.enableOutOfRange ?? false, disabled: false}, []],
          enableTrainingMode: [{value: this.currentSettings.enableTrainingMode ?? false, disabled: false}, []],
          enableVoiceAssistance: [{value: this.currentSettings.enableVoiceAssistance ?? false, disabled: false}, []],
          appModes: [this.currentSettings.appModes, [Validators.required]],
        });

      this.appModesSubscription = this.firestoreService.getAllAppModes().subscribe(appModesList => (this.allAppModesList = appModesList));

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => (this.allLocationsList = locationsList));
    });
  }

  ngOnInit() {

  }

  async updateEnrollmentSettings() {
    if (this.enrollmentSettingsForm.value.appModes.length === 0) {
      this.openSnackBar('At least 1 app mode has to be selected', 'error');
      return;
    }
    const enrollmentSettings = this.enrollmentSettingsForm.value;
    //this.dialogRef.close(this.form.value);
    if (enrollmentSettings.locationId) {
      console.log(`Update location: ${enrollmentSettings.locationId}`);
      enrollmentSettings.locationName = this.allLocationsList
        .filter((location) => location.id === enrollmentSettings.locationId)
        .map((location) => (location.name ? location.name : null))[0];
    } else {
      enrollmentSettings.locationName = null;
      enrollmentSettings.locationId = null;
    }
    const appModesToSave: any = {};
    this.enrollmentSettingsForm.value.appModes.forEach(appMode => {
      if (appMode !== 'SCOUTING_ADVANCED') {
        appModesToSave[appMode] = {name: this.allAppModesList.filter(mode => mode.id === appMode)[0].name};
      } else {
        appModesToSave[appMode] = {
          name: this.allAppModesList.filter(mode => mode.id === appMode)[0].name,
          options: this.allAppModesList.filter(mode => mode.id === appMode)[0].options ?? []
        };
      }
    });
    enrollmentSettings.appModes = appModesToSave;
    this.beingSaved = true;
    this.enrollmentSettingsForm.disable();
    try {
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, {enrollmentSettings})
      this.openSnackBar('Changes have been saved', 'success');
      this.dialogRef.close();
      this.beingSaved = false;
    } catch (error) {
      this.enrollmentSettingsForm.disable();
      this.openSnackBar('Error in saving device settings:' + error.message, 'error');
      console.log(error.message);
      this.beingSaved = false;
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientSubscription?.unsubscribe();
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
