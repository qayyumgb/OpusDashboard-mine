import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatSort} from '@angular/material/sort';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTooltipModule, TooltipPosition} from '@angular/material/tooltip';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import {
  DeviceMainAttributes,
  DeviceRemainingAttributes,
} from '../../common/interfaces/device-interfaces';
import {FirestoreService} from '../../services/firestore.service';
import {ActivateDeviceDialogComponent} from './activate-device-dialog/activate-device-dialog.component';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {EditDeviceDialogComponent} from './edit-device-dialog/edit-device-dialog.component';
import firebase from 'firebase/compat/app';
import {ClientInContextService} from "../../services/client-in-context.service";
import {ConfirmationDialogComponent} from "../utility/confirmation-dialog/confirmation-dialog.component";
import {Timestamp} from 'firebase/firestore';
import {MultipleDeviceEditComponent} from "./multiple-device-edit-dialog/multiple-device-edit.component";
import {SNACKBAR_CLASSES} from "../../common/utils/utils";
import {EnrollmentSettingsDialogComponent} from "./enrollment-settings-dialog/enrollment-settings-dialog.component";

@Component({
  selector: 'app-client-device',
  templateUrl: './client-device.component.html',
  styleUrls: [
    './client-device.component.scss',
    '../../common/styles/listing.scss',
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ClientDeviceComponent implements AfterViewInit, OnDestroy {
  unArchivedVsArchived = 'unarchived';
  datePipe = new DatePipe('en-US');

  deviceAttributesReadableMap: Map<string, string> = new Map([
    ['deviceNumber', 'Device Number'],
    ['lastWorkerName', 'Last Worker'],
    ['locationName', 'Assigned Location'],
    ['appVersion', 'App Version'],
    ['lastActivityTimestamp', 'Last Activity Time'],
    ['lastActivityName', 'Last Activity'],
    ['qc', 'Data QC']
  ]);

  deviceRemainingAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'Device ID'],
    ['added', 'Added'],
    ['lastGeolocation', 'Last Geolocation'],
    ['lastRowNumber', 'Last Row'],
    ['enableAutoTouchLock', 'Enable auto touch lock'],
    ['enableGPS', 'Enable gps'],
    ['enableOutOfRange', 'Enable out of range'],
    ['enableTrainingMode', 'Enable training mode'],
    ['enableVoiceAssistance', 'Enable voice assistance'],
    ['appModes', 'App Modes'],
  ]);
  columnsToDisplay: string[] = [
    'deviceNumber',
    'lastWorkerName',
    'locationName',
    'appVersion',
    'lastActivityTimestamp',
    'lastActivityName',
    'qc',
  ];
  columnsHeadersToDisplay: string[] = [
    'select',
    'deviceIcon',
    'deviceNumber',
    'lastWorkerName',
    'locationName',
    'appVersion',
    'lastActivityTimestamp',
    'lastActivityName',
    'qc',
    'issue',
    'edit'
  ];
  dateColumns: string[] = [
    'added',
    'lastActivityTimestamp'
  ];
  dataSource: MatTableDataSource<DeviceMainAttributes>;
  expandedElement: any = null;
  filterValue: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public deviceList: any[];
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  selectedClientDocData: any;
  clientId: string;
  selectAll = false;
  clientInContextServiceSubscription: Subscription;
  unArchivedDevicesSubscription: Subscription;
  archivedDevicesSubscription: Subscription;
  beingArchived = false;

  constructor(
    public firestoreService: FirestoreService,
    private dialog: MatDialog,
    public authService: AuthService,
    public route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private clientInContextService: ClientInContextService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
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
      this.fetchUnarchivedDevices();
    });
  }

  ngAfterViewInit() {
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {};
    this.dialog.open(ActivateDeviceDialogComponent, dialogConfig);
  }

  openEditDialog($event, deviceRecord) {
    $event.stopPropagation();
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      deviceRecord,
    };
    this.dialog.open(EditDeviceDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.unArchivedDevicesSubscription?.unsubscribe();
    this.archivedDevicesSubscription?.unsubscribe();
  }

  openSnackBar(message) {
    this.snackBar.open(message, '', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  toggleArchived() {
    if (this.areUnArchivedDevicesShown()) {
      this.fetchUnarchivedDevices();
    } else {
      this.fetchArchivedDevices();
    }
  }

  fetchArchivedDevices() {
    this.deviceList = [];
    this.unArchivedDevicesSubscription?.unsubscribe();
    this.archivedDevicesSubscription =
      this.firestoreService
        .getArchivedDevicesForClientId(this.selectedClientDocData.id)
        .subscribe((devicesList) => {
          const currentlySelectedDeviceIds = (this.deviceList && this.deviceList.length > 0) ? this.deviceList.filter(device => device.isSelected).map(device => device.id) : [];
          this.deviceList = devicesList.map((device) => {
            device.deviceId = device.id;
            device.isSelected = currentlySelectedDeviceIds.includes(device.id);
            const remainingAttributesList: any[] = [];
            if ((device.totalDataRecords && device.totalDataRecords > 0)) {
              if (device.consecDupDataRecords || device.consecDupDataRecords === 0) {
                const qcPercent = +(((1 - (device.consecDupDataRecords / device.totalDataRecords)) * 100).toFixed(0));
                device.qc = qcPercent + '%';
              } else {
                device.qc = '100%';
              }
            } else {
              device.qc = 'n/a';
            }
            if (['tablet', 'CLOCK'].includes(device.deviceType)) {
              device.deviceIcon = 'tablet_android';
            } else if (!device.deviceType || device.deviceType === 'WATCH') {
              device.deviceIcon = 'watch';
            }
            for (const [key, value] of Object.entries(device)) {
              if (this.dateColumns.includes(key)) {
                const timeValue = value as Timestamp;
                device[key] = this.datePipe.transform(
                  timeValue.toMillis(),
                  'yyyy-MM-dd HH:mm'
                );
              }
            }

            remainingAttributesList.push(
              [this.deviceRemainingAttributesReadableMap.get('id'), device.id ?? null],
              [this.deviceRemainingAttributesReadableMap.get('added'), device.added ?? null],
              [this.deviceRemainingAttributesReadableMap.get('lastGeolocation'), device.lastGeolocation ?? null],
              [this.deviceRemainingAttributesReadableMap.get('lastRowNumber'), device.lastRowNumber ?? null],
              [this.deviceRemainingAttributesReadableMap.get('enableAutoTouchLock'), device.enableAutoTouchLock],
              [this.deviceRemainingAttributesReadableMap.get('enableGPS'), device.enableGPS],
              [this.deviceRemainingAttributesReadableMap.get('enableOutOfRange'), device.enableOutOfRange],
              [this.deviceRemainingAttributesReadableMap.get('enableTrainingMode'), device.enableTrainingMode],
              [this.deviceRemainingAttributesReadableMap.get('enableVoiceAssistance'), device.enableVoiceAssistance],
              [this.deviceRemainingAttributesReadableMap.get('appModes'), device.appModes ? Object.values(device.appModes).map((appMode: any) => appMode.name).join(', ') : []]
            );

            remainingAttributesList.sort((n1, n2) =>
              n1 > n2 ? 1 : n1 < n2 ? -1 : 0
            );
            return {
              ...device,
              remainingAttributesList,
            };
          });

          this.dataSource = new MatTableDataSource(this.deviceList);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.initiateFiltering();
        });
  }

  fetchUnarchivedDevices() {
    this.deviceList = [];
    this.archivedDevicesSubscription?.unsubscribe();
    this.unArchivedDevicesSubscription =
      this.firestoreService
        .getUnArchivedDevicesForClientId(this.selectedClientDocData.id)
        .subscribe((devicesList) => {
          const currentlySelectedDeviceIds = (this.deviceList && this.deviceList.length > 0) ? this.deviceList.filter(device => device.isSelected).map(device => device.id) : [];
          this.deviceList = devicesList.map((device) => {
            device.deviceId = device.id;
            device.isSelected = currentlySelectedDeviceIds.includes(device.id);
            const remainingAttributesList: any[] = [];
            if ((device.totalDataRecords && device.totalDataRecords > 0)) {
              if (device.consecDupDataRecords || device.consecDupDataRecords === 0) {
                const qcPercent = +(((1 - (device.consecDupDataRecords / device.totalDataRecords)) * 100).toFixed(0));
                device.qc = qcPercent + '%';
              } else {
                device.qc = '100%';
              }
            } else {
              device.qc = 'n/a';
            }
            if (['tablet', 'CLOCK'].includes(device.deviceType)) {
              device.deviceIcon = 'tablet_android';
            } else if(!device.deviceType || device.deviceType === 'WATCH'){
              device.deviceIcon = 'watch';
            }
            for (const [key, value] of Object.entries(device)) {
              if (this.dateColumns.includes(key)) {
                const timeValue = value as Timestamp;
                device[key] = this.datePipe.transform(
                  timeValue.toMillis(),
                  'yyyy-MM-dd HH:mm'
                );
              }
            }

            remainingAttributesList.push(
              [this.deviceRemainingAttributesReadableMap.get('id'), device.id ?? null],
              [this.deviceRemainingAttributesReadableMap.get('added'), device.added ?? null],
              [this.deviceRemainingAttributesReadableMap.get('lastGeolocation'), device.lastGeolocation ?? null],
              [this.deviceRemainingAttributesReadableMap.get('lastRowNumber'), device.lastRowNumber ?? null],
              [this.deviceRemainingAttributesReadableMap.get('enableAutoTouchLock'), device.enableAutoTouchLock],
              [this.deviceRemainingAttributesReadableMap.get('enableGPS'), device.enableGPS],
              [this.deviceRemainingAttributesReadableMap.get('enableOutOfRange'), device.enableOutOfRange],
              [this.deviceRemainingAttributesReadableMap.get('enableTrainingMode'), device.enableTrainingMode],
              [this.deviceRemainingAttributesReadableMap.get('enableVoiceAssistance'), device.enableVoiceAssistance],
              [this.deviceRemainingAttributesReadableMap.get('appModes'), device.appModes ? Object.values(device.appModes).map((appMode: any) => appMode.name).join(', ') : []]
            );

            remainingAttributesList.sort((n1, n2) =>
              n1 > n2 ? 1 : n1 < n2 ? -1 : 0
            );
            return {
              ...device,
              remainingAttributesList,
            };
          });

          this.dataSource = new MatTableDataSource(this.deviceList);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.initiateFiltering();
        });
  }

  initiateFiltering() {
    if (this.filterValue) {
      this.dataSource.filter = this.filterValue.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  areArchivedDevicesShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedDevicesShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }

  archiveDevice($event, device) {
    $event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive device '${device?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        device
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.archiveDeviceById(value?.device?.id)
          this.snackBar.open(`Device '${value?.device?.name}' archived successfully`, '', {
            duration: 5000,
            panelClass: ['snackbar-success'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        } catch (error) {
          this.snackBar.open(`Error in archiving devie '${value?.device?.name}'.\nPlease try again and/or contact support if problem persists`, '', {
            panelClass: ['snackbar-error'],
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
    });
  }

  async unarchiveDevice(device) {
    try {
      await this.firestoreService.unArchiveDeviceById(device?.id);
      this.snackBar.open(`Device '${device?.name}' unarchived successfully`, '', {
        duration: 5000,
        panelClass: ['snackbar-success'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      this.snackBar.open(`Error in unarchiving device '${device?.name}'.\nPlease try again and/or contact support if problem persists`, '', {
        panelClass: ['snackbar-error'],
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  async saveIssue($event, device) {
    try {
      await this.firestoreService.updateIssueForDevice(device.id, device.hasIssue);
      this.snackBar.open(`Device issue ${device.hasIssue ? 'saved' : 'removed'} successfully`, '', {
        duration: 5000,
        panelClass: ['snackbar-success'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      this.snackBar.open(`Error in ${device.hasIssue ? 'saving' : 'removing'} device issue`, '', {
        duration: 5000,
        panelClass: ['snackbar-error'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  toggleMultiSelect() {
    this.selectAll = !!this.selectAll;
    this.deviceList.forEach(device => {
      device.isSelected = this.selectAll;
    });
  }

  areMultipleDevicesSelected() {
    const selectedDevicesCount = this.deviceList?.filter(device => device.isSelected)?.length;
    return (selectedDevicesCount > 1);
  }

  determineIndeterminate() {
    const deviceCount = this.deviceList?.length;
    const selectedDevicesCount = this.deviceList?.filter(device => device.isSelected)?.length;
    if (selectedDevicesCount === deviceCount || selectedDevicesCount === 0) {
      return false;
    } else if (selectedDevicesCount > 0 && selectedDevicesCount < deviceCount) {
      return true;
    }
  }

  editMultipleDevices() {
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      selectedDeviceIds: this.deviceList?.filter(device => device.isSelected).map(device => device.id)
    };
    this.dialog.open(MultipleDeviceEditComponent, dialogConfig);
  }

  archiveMultipleDevices() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive ${this.deviceList?.filter(device => device.isSelected).map(device => device.id).length} devices ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        selectedDeviceIds: this.deviceList?.filter(device => device.isSelected).map(device => device.id)
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        this.beingArchived = true;
        this.firestoreService.updateDevices(this.deviceList?.filter(device => device.isSelected).map(device => device.id),
          {isArchived: true})
          .subscribe({
            next: async (apiResponse) => {
              this.beingArchived = false;
              if (apiResponse.success) {
                this.openSpecificSnackBar('All devices have been archived', 'success');
              } else if (apiResponse.success === false) {
                this.openSpecificSnackBar('Error in archiving devices:' + apiResponse.error, 'error');
              }
            },
            error: (error) => {
              this.beingArchived = false;
              this.openSpecificSnackBar('Error in archiving devices:' + error.message, 'error');
              console.log(error.message);
            }
          });
      }
    });
  }

  editEnrollmentSettings() {
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      selectedClientDocData: this.selectedClientDocData
    };
    this.dialog.open(EnrollmentSettingsDialogComponent, dialogConfig);
  }

  getSelectedDeviceCount() {
    const selectedCount = this.deviceList?.filter(device => device.isSelected).map(device => device.id).length;
    if (selectedCount <= 1) {
      return '';
    } else {
      return `(${selectedCount})`;
    }
  }

  expandRow(element: any) {
    this.expandedElement = this.expandedElement?.deviceId === element.deviceId ? null : element;
  }

  applyExpandedClass(element: any) {
    return this.expandedElement?.deviceId === element.deviceId;
  }

  openSpecificSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
