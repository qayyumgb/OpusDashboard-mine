import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {FirestoreService} from "../../services/firestore.service";
import {ClientInContextService} from "../../services/client-in-context.service";
import {AuthService} from "../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../common/utils/utils";

@Component({
  selector: 'app-client-presences',
  templateUrl: './client-presences.component.html',
  styleUrls: ['./client-presences.component.scss',
    '../../common/styles/listing.scss'],
  styles: [`
    :host {
      display: flex;
      justify-content: center;
    }
  `]
})
export class ClientPresencesComponent implements OnInit, OnDestroy {
  autoArchiveShortSessions: boolean;
  private clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(private firestoreService: FirestoreService,
              private clientInContextService: ClientInContextService,
              private authService: AuthService,
              private snackBar: MatSnackBar) {
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      this.autoArchiveShortSessions = selectedClientDocData.autoArchiveShortSessions ?? false;//set to false for backward compatibility
    });
  }

  ngOnInit(): void {
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  async saveAutoArchiveSessionFlag() {
    if (this.selectedClientDocData.hasOwnProperty('autoArchiveShortSessions')) {//for backward compatibility
      if (this.autoArchiveShortSessions === this.selectedClientDocData.autoArchiveShortSessions) {
        this.openSnackBar('No changes to save!', 'error');
        return;
      }
    }

    try {
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, {
        autoArchiveShortSessions: this.autoArchiveShortSessions,
      });
      this.reloadClientInContext();
      this.openSnackBar('Setting for auto archiving sessions changed successfully!', 'success');
    } catch (error) {
      this.openSnackBar('Error in saving setting for auto archiving sessions:' + error.message, 'error');
    }
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

