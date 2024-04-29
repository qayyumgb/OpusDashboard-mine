import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {FirestoreService} from "../../services/firestore.service";
import {ClientInContextService} from "../../services/client-in-context.service";
import {AuthService} from "../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../common/utils/utils";
import {v4 as uuidv4} from 'uuid';

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
  unArchivedVsArchived = 'unarchived';
  displayedAutoBreakOptionsList: any[] = [];
  allwgGroupsList: any[];
  wgListSubscription: Subscription;
  registerWatchBreaksFlag = false;
  registerWatchCheckInFlag = false;
  registerWatchCheckOutFlag = false;
  breakNotificationsWatchEnabled = false;
  defaultBreak: any = {
    name: '',
    breakTaskFunction: 'BREAK_PAID'
  }

  constructor(private firestoreService: FirestoreService,
              private clientInContextService: ClientInContextService,
              private authService: AuthService,
              private snackBar: MatSnackBar) {
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      this.defaultBreak = {...selectedClientDocData.defaultBreak};
      this.displayedAutoBreakOptionsList = selectedClientDocData.autoBreakOptions?.slice() ?? [];
      this.registerWatchBreaksFlag = selectedClientDocData.registerWatchBreaks ?? false;
      this.registerWatchCheckInFlag = selectedClientDocData.registerWatchCheckIn ?? false;
      this.registerWatchCheckOutFlag = selectedClientDocData.registerWatchCheckOut ?? false;
      this.breakNotificationsWatchEnabled = selectedClientDocData.breakNotificationsWatchEnabled ?? false;
      this.autoArchiveShortSessions = selectedClientDocData.autoArchiveShortSessions ?? false;//set to false for backward compatibility
    });

    this.wgListSubscription = this.firestoreService
      .getAllUnarchivedWorkerGroupsForClientId(this.selectedClientDocData?.id)
      .subscribe((wgList) => (this.allwgGroupsList = wgList.sort((wgA: any, wgB: any) => {
        return wgA.name?.toLowerCase() < wgB.name?.toLowerCase() ? -1 : wgA.name?.toLowerCase() > wgB.name?.toLowerCase() ? 1 : 0;
      })));
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
    this.wgListSubscription?.unsubscribe();
  }

  areArchivedBreakSchemesShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedBreakSchemesShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }

  breakSchemeChanged(attribute, breakSchemeObj) {
    //console.log('changed breakScheme:' + JSON.stringify(breakSchemeObj, undefined, 4));
  }

  createNewBreakScheme() {
    const newBreakSchemeObject: any = {
      uuid: uuidv4(),
      isAutoEnabled: true,
      isDeviceEnabled: true,
      isArchived: false,
      startTime: '00:00',
      endTime: '00:00',
      breakTime: '00:00',
      duration: 0,
      workerGroupIds: [],
      breakType: 'PAID',
      name: ''
    }
    this.displayedAutoBreakOptionsList.push(newBreakSchemeObject);
  }

  async archiveBreakScheme($event, breakScheme, isArchival) {
    if (this.selectedClientDocData.autoBreakOptions.filter(bs => bs.uuid === breakScheme.uuid).length === 0) {
      //break scheme is not saved yet in Firestore
      this.displayedAutoBreakOptionsList.filter(bs => bs.uuid === breakScheme.uuid)[0].isArchived = isArchival;
      return;
    }
    this.selectedClientDocData.autoBreakOptions = this.selectedClientDocData.autoBreakOptions
      .map(bs => {
        if (bs.uuid === breakScheme.uuid) {
          return {
            ...bs,
            isArchived: isArchival
          }
        } else {
          return bs;
        }
      });
    try {
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, {
        autoBreakOptions: this.selectedClientDocData.autoBreakOptions
      });
      this.reloadClientInContext();
      if (isArchival) {
        this.openSnackBar('Break Schemes archived successfully', 'success');
      } else {
        this.openSnackBar('Break Schemes unarchived successfully', 'success');
      }
    } catch (error) {
      console.log('Error in archiving/unarchiving break scheme:' + JSON.stringify(error));
      if (isArchival) {
        this.openSnackBar('Error in archiving break scheme:' + error.message, 'failure');
      } else {
        this.openSnackBar('Error in unarchiving break scheme:' + error.message, 'failure');
      }
    }
  }

  async saveBreakSchemes() {
    try {
      if (!this.defaultBreak.name) {
        this.openSnackBar('Default break name is mandatory', 'error');
        return;
      }
      const clientUpdateObject: any = {};
      if (this.defaultBreak.name !== this.selectedClientDocData.defaultBreak?.name ||
        this.defaultBreak.breakTaskFunction !== this.selectedClientDocData.defaultBreak?.breakTaskFunction) {
        clientUpdateObject.defaultBreak = this.defaultBreak;
        await this.firestoreService.updateTaskByIdForClientId(this.selectedClientDocData.pauseTaskId, this.selectedClientDocData.id, {
          name: this.defaultBreak.name,
          func: this.defaultBreak.breakTaskFunction
        })
      }
      clientUpdateObject.breakNotificationsWatchEnabled = this.breakNotificationsWatchEnabled;
      clientUpdateObject.autoBreakOptions = this.displayedAutoBreakOptionsList;
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, clientUpdateObject);
      this.reloadClientInContext();
      this.openSnackBar('Break Schemes saved successfully', 'success');
    } catch (error) {
      console.log('Error in saving break scheme:' + JSON.stringify(error));
      this.openSnackBar('Error in saving break scheme:' + error.message, 'failure');
    }

  }

  cancelClickedOnBreakSchemes() {
    this.displayedAutoBreakOptionsList = this.selectedClientDocData.autoBreakOptions.filter(breakScheme => breakScheme.isArchived === this.areArchivedBreakSchemesShown());
  }

  getBreakSchemesToDisplay() {
    if (this.areUnArchivedBreakSchemesShown()) {
      return this.displayedAutoBreakOptionsList.filter(bs => !bs.isArchived);
    } else {
      return this.displayedAutoBreakOptionsList.filter(bs => bs.isArchived);
    }
  }

  async savePresenceFlags() {
    if (this.registerWatchBreaksFlag === this.selectedClientDocData.registerWatchBreaks &&
      this.registerWatchCheckInFlag === this.selectedClientDocData.registerWatchCheckIn &&
      this.registerWatchCheckOutFlag === this.selectedClientDocData.registerWatchCheckOut) {
      this.openSnackBar('No changes to save', 'error');
      return;
    }

    try {
      await this.firestoreService.updateClientById(this.selectedClientDocData.id, {
        registerWatchBreaks: this.registerWatchBreaksFlag,
        registerWatchCheckIn: this.registerWatchCheckInFlag,
        registerWatchCheckOut: this.registerWatchCheckOutFlag
      });
      this.reloadClientInContext();
      this.openSnackBar('Presence settings for watch saved successfully', 'success');
    } catch (error) {
      console.log('Error in saving presence settings for watch:' + JSON.stringify(error));
      this.openSnackBar('Error in saving presence settings for watch:' + error.message, 'failure');
    }
  }

  cancelClickedPresenceFlags() {
    this.registerWatchBreaksFlag = this.selectedClientDocData.registerWatchBreaks ?? false;
    this.registerWatchCheckInFlag = this.selectedClientDocData.registerWatchCheckIn ?? false;
    this.registerWatchCheckOutFlag = this.selectedClientDocData.registerWatchCheckOut ?? false;
  }

}

