import {Component, OnDestroy, OnInit} from '@angular/core';
import {SNACKBAR_CLASSES} from "../../common/utils/utils";
import {FirestoreService} from "../../services/firestore.service";
import {Subscription} from "rxjs";
import {ClientInContextService} from "../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-client-general',
  templateUrl: './client-general.component.html',
  styleUrls: ['./client-general.component.scss',
    '../../common/styles/listing.scss']
})
export class ClientGeneralComponent implements OnInit, OnDestroy {
  deviceSecurityCode: string;
  workerCodeWatchEnabled: string;
  workerCodeClockEnabled: string;
  private clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  correctionFactor: number;

  constructor(private firestoreService: FirestoreService,
              private clientInContextService: ClientInContextService,
              private authService: AuthService,
              private snackBar: MatSnackBar) {
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      this.deviceSecurityCode = selectedClientDocData.deviceSecurityCode;
      this.workerCodeWatchEnabled = selectedClientDocData.workerCodeWatchEnabled ?? false;//set to false for backward compatibility
      this.workerCodeClockEnabled = selectedClientDocData.workerCodeClockEnabled ?? false;//set to false for backward compatibility
      this.correctionFactor = selectedClientDocData.correctionFactor;
    });
  }

  ngOnInit(): void {
  }

  async saveDeviceSecurityCode() {
    if (!this.deviceSecurityCode) {
      this.openSnackBar('Device Reset Code is a mandatory field!', 'error');
      return;
    }

    if (this.deviceSecurityCode === this.selectedClientDocData.deviceSecurityCode &&
      this.workerCodeWatchEnabled === this.selectedClientDocData.workerCodeWatchEnabled &&
      this.workerCodeClockEnabled === this.selectedClientDocData.workerCodeClockEnabled) {
      this.openSnackBar('No changes to save!', 'error');
      return;
    }

    if (!/^([0-9]{4})$/.test(this.deviceSecurityCode)) {
      this.openSnackBar('Please enter exactly 4 digits for device reset code!', 'error');
      return;
    }

    try {
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, {
        deviceSecurityCode: this.deviceSecurityCode,
        workerCodeWatchEnabled: this.workerCodeWatchEnabled,
        workerCodeClockEnabled: this.workerCodeClockEnabled
      });
      this.reloadClientInContext();
      this.openSnackBar('Security Settings are changed successfully!', 'success');
    } catch (error) {
      this.openSnackBar('Error in saving device reset code:' + error.message, 'error');
    }
  }

  async saveCorrectionFactor() {
    if (!this.correctionFactor) {
      this.openSnackBar('Correction factor is a mandatory field!', 'error');
      return;
    }

    if (this.correctionFactor === this.selectedClientDocData.correctionFactor) {
      this.openSnackBar('No changes to save!', 'error');
      return;
    }

    if (!/^-?\d+(\.\d{1,2})?$/.test(this.correctionFactor + '')) {
      this.openSnackBar('Please enter a decimal number with 0/1/2 decimal place digits for correction factor!', 'error');
      return;
    }

    try {
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, {
        correctionFactor: +this.correctionFactor,
      });
      this.reloadClientInContext();
      this.openSnackBar('Correction factor changed successfully!', 'success');
    } catch (error) {
      this.openSnackBar('Error in saving correction factor:' + error.message, 'error');
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

  reloadClientInContext() {
    const clientSubscription = this.firestoreService
      .getClientById(this.selectedClientDocData.id)
      .subscribe((clientFromDB) => {
        const loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
          (userDocData) => {
            if (userDocData) {
              const clientElementInUserDoc = userDocData?.clients.filter(client => client.clientId === clientFromDB.id);
              if (clientElementInUserDoc && clientElementInUserDoc.length > 0) {
                clientFromDB.role = clientElementInUserDoc[0]?.role;
              }
              this.clientInContextService.clientInContextSubject.next(clientFromDB);
              loggedInUserFromAuthServiceSubscription?.unsubscribe();
              clientSubscription?.unsubscribe();
            }
          });
      });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
  }

}
