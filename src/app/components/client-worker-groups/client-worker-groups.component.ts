import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {DatePipe} from '@angular/common';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../services/firestore.service';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute} from '@angular/router';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ClientInContextService} from '../../services/client-in-context.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BreakpointService} from '../../services/breakpoint.service';
import {CreateWorkerGroupDialogComponent} from './create-worker-group-dialog/create-worker-group-dialog.component';
import {EditWorkerGroupDialogComponent} from './edit-worker-group-dialog/edit-worker-group-dialog.component';
import {ConfirmationDialogComponent} from '../utility/confirmation-dialog/confirmation-dialog.component';
import {SNACKBAR_CLASSES} from '../../common/utils/utils';
import {Timestamp} from 'firebase/firestore';
import {WorkerGroupMainAttributes} from "../../common/interfaces/worker-interfaces";

@Component({
  selector: 'app-client-worker-groups',
  templateUrl: './client-worker-groups.component.html',
  styleUrls: ['./client-worker-groups.component.scss',
    '../../common/styles/listing.scss',]
})
export class ClientWorkerGroupsComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  workerGroupAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['name', 'Name'],
    ['creationTimestamp', 'Created At'],
  ]);

  screenSize = 'default';

  columnsToDisplay: string[] = ['id', 'name', 'showOnWatch', 'showOnClock', 'creationTimestamp'];
  columnsHeadersToDisplay: string[] = [
    'name',
    'creationTimestamp',
    'Edit',
  ];
  dataSource: MatTableDataSource<WorkerGroupMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  workerGroupsList: any[];
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unarchivedWorkerGroupsSubscription: Subscription;
  archivedWorkerGroupsSubscription: Subscription;
  breakpointSubscription: Subscription;
  filterValue: string

  constructor(public firestoreService: FirestoreService,
              public authService: AuthService,
              public route: ActivatedRoute,
              private dialog: MatDialog,
              private clientInContextService: ClientInContextService,
              private snackBar: MatSnackBar,
              private breakpointService: BreakpointService
  ) {
    this.breakpointSubscription = this.breakpointService.screenSize$.subscribe(screenSize => this.screenSize = screenSize);
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
      this.fetchUnarchivedWorkerGroups();
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
    dialogConfig.autoFocus = true;
    dialogConfig.data = {};
    this.dialog.open(CreateWorkerGroupDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      workerGroupRecord: record
    };

    this.dialog.open(EditWorkerGroupDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.archivedWorkerGroupsSubscription?.unsubscribe();
    this.unarchivedWorkerGroupsSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  async archiveWorkerGroup(workerGroup) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive worker group '${workerGroup?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        workerGroup
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.updateWorkerGroupByIdForClientId(value?.workerGroup?.id, this.selectedClientDocData?.id, {isArchived: true});
          this.openSnackBar(`Worker Group '${value?.workerGroup?.name}' archived successfully`, 'success');
        } catch (error) {
          this.openSnackBar('Error in worker group archival: ' + error.message, 'error');
          console.log(error.message);
        }
      }
    });
  }

  async unarchiveWorkerGroup(workerGroup) {
    try {
      await this.firestoreService.updateWorkerGroupByIdForClientId(workerGroup?.id, this.selectedClientDocData?.id, {isArchived: false});
      this.openSnackBar(`WorkerGroup '${workerGroup?.name}' unarchived successfully`, 'success');
    } catch (error) {
      this.openSnackBar('Error in worker group archival: ' + error.message, 'error');
      console.log(error.message);
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

  toggleArchived() {
    if (this.areUnArchivedWorkerGroupsShown()) {
      this.fetchUnarchivedWorkerGroups();
    } else {
      this.fetchAllArchivedWorkerGroups();
    }
  }

  fetchUnarchivedWorkerGroups() {
    this.workerGroupsList = [];
    this.archivedWorkerGroupsSubscription?.unsubscribe();
    this.unarchivedWorkerGroupsSubscription = this.firestoreService
      .getAllUnarchivedWorkerGroupsForClientId(this.selectedClientDocData.id)
      .subscribe((workerGroupsList) => {
        this.workerGroupsList = workerGroupsList.map((workerGroup) => {
          for (const [key, value] of Object.entries(workerGroup)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              workerGroup[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }

          return workerGroup;
        });

        this.workerGroupsList.sort((workerGroupA: any, workerGroupB: any) => {
          return workerGroupA.name < workerGroupB.name ? -1 : workerGroupA.name > workerGroupB.name ? 1 : 0;
        });
        this.dataSource = new MatTableDataSource(this.workerGroupsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchAllArchivedWorkerGroups() {
    this.workerGroupsList = [];
    this.unarchivedWorkerGroupsSubscription?.unsubscribe();
    this.archivedWorkerGroupsSubscription = this.firestoreService
      .getAllArchivedWorkerGroupsForClientId(this.selectedClientDocData.id)
      .subscribe((workerGroupsList) => {
        this.workerGroupsList = workerGroupsList.map((workerGroup) => {
          for (const [key, value] of Object.entries(workerGroup)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              workerGroup[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }

          return workerGroup;
        });

        this.workerGroupsList.sort((workerGroupA: any, workerGroupB: any) => {
          return workerGroupA.name < workerGroupB.name ? -1 : workerGroupA.name > workerGroupB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.workerGroupsList);
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

  areArchivedWorkerGroupsShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedWorkerGroupsShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}

