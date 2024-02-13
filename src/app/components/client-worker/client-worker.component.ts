import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {CreateWorkerDialogComponent} from './create-worker-dialog/create-worker-dialog.component';
import {MatTableDataSource} from '@angular/material/table';
import {WorkerMainAttributes} from '../../common/interfaces/worker-interfaces';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {FirestoreService} from '../../services/firestore.service';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute} from '@angular/router';
import {EditWorkerDialogComponent} from './edit-worker-dialog/edit-worker-dialog.component';
import {DatePipe} from '@angular/common';
import firebase from 'firebase/compat/app';
//import {Timestamp} from 'firebase/firestore';
import {ClientInContextService} from "../../services/client-in-context.service";
import {ConfirmationDialogComponent} from "../utility/confirmation-dialog/confirmation-dialog.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Timestamp} from 'firebase/firestore';


@Component({
  selector: 'app-client-worker',
  templateUrl: './client-worker.component.html',
  styleUrls: [
    './client-worker.component.scss',
    '../../common/styles/listing.scss',
  ],
})
export class ClientWorkerComponent implements AfterViewInit, OnDestroy {
  unArchivedVsArchived = 'unarchived';
  workerAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['workerCode', 'Code'],
    ['name', 'Name'],
    ['isLeftHanded', 'Left Handed'],
    ['notes', 'Notes'],
    ['locationNames', 'Locations'],
    ['creationTimestamp', 'Created At'],
  ]);

  columnsToDisplay: string[] = ['id', 'workerCode', 'name', 'isLeftHanded', 'notes', 'locationNames', 'creationTimestamp'];
  columnsHeadersToDisplay: string[] = [
    'name',
    'workerCode',
    'isLeftHanded',
    'notes',
    'locationNames',
    'creationTimestamp',
    'Edit',
  ];
  dataSource: MatTableDataSource<WorkerMainAttributes>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public workerList: [];
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  selectedClientDocData: any;
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  clientInContextServiceSubscription: Subscription;
  unArchivedWorkersSubscription: Subscription;
  archivedWorkersSubscription: Subscription;
  locationListSubscription: Subscription;
  allLocationsList: any[];
  filterValue: string;

  constructor(
    public firestoreService: FirestoreService,
    public authService: AuthService,
    public route: ActivatedRoute,
    private dialog: MatDialog,
    private clientInContextService: ClientInContextService,
    private snackBar: MatSnackBar
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

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => (this.allLocationsList = locationsList));

      this.fetchUnarchivedWorkers();
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

    this.dialog.open(CreateWorkerDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();

    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: record.id,
      workerCode: record.workerCode,
      name: record.name,
      locationIds: record.locationIds,
      notes: record.notes,
      isLeftHanded: record.isLeftHanded,
      workerGroupId: record.workerGroupId
    };

    this.dialog.open(EditWorkerDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.unArchivedWorkersSubscription?.unsubscribe();
    this.archivedWorkersSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
  }

  archiveWorker(worker) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive worker '${worker?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        worker
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.archiveWorkerByIdForClientId(value?.worker?.id, this.selectedClientDocData.id);
          this.snackBar.open(`Worker '${value?.worker?.name}' archived successfully`, '', {
            duration: 5000,
            panelClass: ['snackbar-success'],
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        } catch (error) {
          this.snackBar.open(`Error in archiving worker '${value?.worker?.name}'.\nPlease try again and/or contact support if problem persists`, '', {
            panelClass: ['snackbar-error'],
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      }
    });
  }

  async unarchiveWorker(worker) {
    try {
      await this.firestoreService.unArchiveWorkerByIdForClientId(worker?.id, this.selectedClientDocData.id);
      this.snackBar.open(`Worker '${worker?.name}' unarchived successfully`, '', {
        duration: 5000,
        panelClass: ['snackbar-success'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      this.snackBar.open(`Error in unarchiving worker '${worker?.name}'.\nPlease try again and/or contact support if problem persists`, '', {
        panelClass: ['snackbar-error'],
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  toggleArchived() {
    if (this.areUnArchivedWorkersShown()) {
      this.fetchUnarchivedWorkers();
    } else {
      this.fetchArchivedWorkers();
    }
  }

  fetchUnarchivedWorkers() {
    this.archivedWorkersSubscription?.unsubscribe();
    this.unArchivedWorkersSubscription = this.firestoreService
      .getUnArchivedWorkersForClientId(this.selectedClientDocData.id)
      .subscribe((workerList) => {
        this.workerList = workerList.map((worker) => {
          for (const [key, value] of Object.entries(worker)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              worker[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          let locationNames = '';
          if (worker.locationIds && Array.isArray(worker.locationIds) && (worker.locationIds.length > 0)) {
            locationNames = this.allLocationsList.filter(loc => worker.locationIds.includes(loc.id))
              .map(loc => loc.name).sort((a,b) => a.toLowerCase() < b.toLowerCase() ? -1 : a?.toLowerCase() > b?.toLowerCase() ? 1 : 0).join(', ');
          }
          worker.locationNames = locationNames;
          return {
            ...worker,
          };
        });

        this.workerList.sort((workerA: any, workerB: any) => {
          return workerA.name < workerB.name ? -1 : workerA.name > workerB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.workerList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchArchivedWorkers() {
    this.unArchivedWorkersSubscription?.unsubscribe();
    this.archivedWorkersSubscription = this.firestoreService
      .getArchivedWorkersForClientId(this.selectedClientDocData.id)
      .subscribe((workerList) => {
        this.workerList = workerList.map((worker) => {
          for (const [key, value] of Object.entries(worker)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              worker[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return {
            ...worker,
          };
        });

        this.workerList.sort((workerA: any, workerB: any) => {
          return workerA.name < workerB.name ? -1 : workerA.name > workerB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.workerList);
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

  areArchivedWorkersShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedWorkersShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}
