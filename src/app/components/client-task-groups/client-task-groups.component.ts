import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {TaskMainAttributes} from '../../common/interfaces/clock-interfaces';
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
import {CreateTaskGroupDialogComponent} from './create-task-group-dialog/create-task-group-dialog.component';
import {EditTaskGroupDialogComponent} from './edit-task-group-dialog/edit-task-group-dialog.component';
import {ConfirmationDialogComponent} from '../utility/confirmation-dialog/confirmation-dialog.component';
import {SNACKBAR_CLASSES} from '../../common/utils/utils';
import {Timestamp} from 'firebase/firestore';

@Component({
  selector: 'app-client-task-groups',
  templateUrl: './client-task-groups.component.html',
  styleUrls: ['./client-task-groups.component.scss',
    '../../common/styles/listing.scss',]
})
export class ClientTaskGroupsComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  taskAttributesReadableMap: Map<string, string> = new Map([
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
  dataSource: MatTableDataSource<TaskMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  taskGroupsList: any[];
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unarchivedTaskGroupsSubscription: Subscription;
  archivedTaskGroupsSubscription: Subscription;
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
      this.fetchUnarchivedTaskGroups();
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
    this.dialog.open(CreateTaskGroupDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      taskGroupRecord: record
    };

    this.dialog.open(EditTaskGroupDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.archivedTaskGroupsSubscription?.unsubscribe();
    this.unarchivedTaskGroupsSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  async archiveTaskGroup(taskGroup) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive task group '${taskGroup?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        task: taskGroup
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.updateTaskGroupByIdForClientId(value?.task?.id, this.selectedClientDocData?.id, {isArchived: true});
          this.openSnackBar(`Task '${value?.taskGroup?.name}' archived successfully`, 'success');
        } catch (error) {
          this.openSnackBar('Error in task group archival: ' + error.message, 'error');
          console.log(error.message);
        }
      }
    });
  }

  async unarchiveTaskGroup(taskGroup) {
    try {
      await this.firestoreService.updateTaskGroupByIdForClientId(taskGroup?.id, this.selectedClientDocData?.id, {isArchived: false});
      this.openSnackBar(`Task '${taskGroup?.name}' unarchived successfully`, 'success');
    } catch (error) {
      this.openSnackBar('Error in task group archival: ' + error.message, 'error');
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
    if (this.areUnArchivedTaskGroupsShown()) {
      this.fetchUnarchivedTaskGroups();
    } else {
      this.fetchAllArchivedTaskGroups();
    }
  }

  fetchUnarchivedTaskGroups() {
    this.taskGroupsList = [];
    this.archivedTaskGroupsSubscription?.unsubscribe();
    this.unarchivedTaskGroupsSubscription = this.firestoreService
      .getAllUnarchivedTaskGroupsForClientId(this.selectedClientDocData.id)
      .subscribe((taskGroupsList) => {
        this.taskGroupsList = taskGroupsList.map((task) => {
          for (const [key, value] of Object.entries(task)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              task[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }

          return task;
        });

        this.taskGroupsList.sort((taskGroupA: any, taskGroupB: any) => {
          return taskGroupA.name < taskGroupB.name ? -1 : taskGroupA.name > taskGroupB.name ? 1 : 0;
        });
        this.dataSource = new MatTableDataSource(this.taskGroupsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchAllArchivedTaskGroups() {
    this.taskGroupsList = [];
    this.unarchivedTaskGroupsSubscription?.unsubscribe();
    this.archivedTaskGroupsSubscription = this.firestoreService
      .getAllArchivedTaskGroupsForClientId(this.selectedClientDocData.id)
      .subscribe((taskGroupsList) => {
        this.taskGroupsList = taskGroupsList.map((task) => {
          for (const [key, value] of Object.entries(task)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              task[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }

          return task;
        });

        this.taskGroupsList.sort((taskGroupA: any, taskGroupB: any) => {
          return taskGroupA.name < taskGroupB.name ? -1 : taskGroupA.name > taskGroupB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.taskGroupsList);
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

  areArchivedTaskGroupsShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedTaskGroupsShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}

