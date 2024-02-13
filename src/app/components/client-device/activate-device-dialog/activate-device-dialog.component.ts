import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {FirestoreService} from '../../../services/firestore.service';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../../../services/auth.service';
import {Subscription} from 'rxjs';
import {MatStepper} from '@angular/material/stepper';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-create-device-dialog',
  templateUrl: './activate-device-dialog.component.html',
  styleUrls: ['./activate-device-dialog.component.scss'],
})
export class ActivateDeviceDialogComponent implements OnInit, OnDestroy {
  activationKey = '';
  deviceNumber = '';
  description: string;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  progressMessage: any;
  deviceId: string;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  @ViewChild('stepper') private myStepper: MatStepper;
  private clientSubscription: Subscription;
  private clientFromDb: any;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private auth: AngularFireAuth,
    private dialogRef: MatDialogRef<ActivateDeviceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.description = data.description;

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
      this.clientSubscription = this.firestoreService.getClientById(this.selectedClientDocData.id).subscribe(client => {
        this.clientSubscription?.unsubscribe();
        this.clientFromDb = client;
        if (client.enrollmentSettings && client.enrollmentSettings.nextDeviceNumber) {
          this.deviceNumber = client.enrollmentSettings.nextDeviceNumber ?? '0000';
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.clientSubscription?.unsubscribe();
  }

  ngOnInit() {

  }

  validate(input) {

    if (!this.activationKey) {
      return;
    }

    try {
      this.auth.idToken.subscribe(token => {
        if (token) {
          this.firestoreService
            .validateKey(this.activationKey, this.selectedClientDocData?.id, token)
            .subscribe({
              next: (response) => {
                if (response.success) {
                  this.openSnackBar(response.message, 'success');
                  this.deviceId = response.id;
                  setTimeout(() => {
                    this.goForward();
                  }, 2000);
                }
                this.progressMessage = null;
                input.srcElement.disabled = false;
                this.progressMessage = null;
              },
              error: (error) => {
                if (error?.error) {
                  this.openSnackBar(error?.error?.message, 'error');
                  input.srcElement.disabled = false;
                  this.activationKey = '';
                  input.target.value = '';
                  this.progressMessage = '';
                } else {
                  this.openSnackBar('Request failed due to SYSTEM ERROR.', 'error');
                }
              }
            });
        }
      });
    } catch (error) {
      this.progressMessage = null;
      input.srcElement.disabled = false;
      console.log(error.message);
    }
  }

  goForward() {
    this.myStepper.next();
  }

  close() {
    this.dialogRef.close();
  }

  async deviceNumberConfirmed($event) {
    $event.stopPropagation();
    if (!this.deviceNumber) {
      this.myStepper.next();
      return;
    }
    if (!/^[0-9]{4}$/.test(this.deviceNumber)) {
      this.openSnackBar('Please enter only digits for device number!', 'error');
      return;
    }
    const deviceNo = +this.deviceNumber;
    if (this.deviceNumber !== this.clientFromDb.nextDeviceNumber) {
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, {
        enrollmentSettings: {
          ...this.clientFromDb.enrollmentSettings,
          nextDeviceNumber: ('0000' + (deviceNo + 1)).slice(-4)
        }
      })

    }
    this.updateDevice();
  }

  async updateDevice() {
    const deviceDataToUpdate: any = {
      deviceNumber: this.deviceNumber
    };
    deviceDataToUpdate.notes = '';
    try {
      deviceDataToUpdate.id = this.deviceId;

      await this.firestoreService.updateDevice(deviceDataToUpdate, true);
      this.openSnackBar('Changes have been saved', 'success');
      setTimeout(() => {
        this.goForward();
      }, 500);
    } catch (error) {
      this.openSnackBar('Error in saving changes:' + error.message, 'error');
      console.log(error.message);
    }
  }

  autocapitalize(input): void {
    const value = input.target.value.toUpperCase();
    this.activationKey = value;
    input.target.value = value;
    if (value.length >= 4) {
      this.progressMessage = 'Wait a few seconds for validating the device key';
      input.srcElement.disabled = true;
      this.validate(input);
    }
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
