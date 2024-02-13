import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {ConfirmationDialogComponent} from '../utility/confirmation-dialog/confirmation-dialog.component';
import {SNACKBAR_CLASSES} from '../../common/utils/utils';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import {CreateTaskDialogComponent} from "./create-task-dialog/create-task-dialog.component";
import {EditTaskDialogComponent} from "./edit-task-dialog/edit-task-dialog.component";

@Component({
  selector: 'app-client-tasks',
  templateUrl: './client-tasks.component.html',
  styleUrls: ['./client-tasks.component.scss',
    '../../common/styles/listing.scss',]
})

export class ClientTasksComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  taskAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['name', 'Name'],
    ['showOnWatch', 'Show on watch'],
    ['showOnClock', 'Show on clock'],
    ['taskGroups', 'Task Groups'],
    ['creationTimestamp', 'Created At'],
  ]);

  screenSize = 'default';

  columnsToDisplay: string[] = ['id', 'name', 'showOnWatch', 'showOnClock', 'taskGroups', 'creationTimestamp'];
  columnsHeadersToDisplay: string[] = [
    'name',
    'showOnWatch',
    'showOnClock',
    'taskGroups',
    'creationTimestamp',
    'Edit',
  ];
  dataSource: MatTableDataSource<TaskMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  tasksList: any[];
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unarchivedTasksSubscription: Subscription;
  archivedTasksSubscription: Subscription;
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
      this.fetchUnarchivedTasks();
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
    this.dialog.open(CreateTaskDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      taskRecord: record
    };

    this.dialog.open(EditTaskDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.archivedTasksSubscription?.unsubscribe();
    this.unarchivedTasksSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  async archiveTask(task) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive task '${task?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        task
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.updateTaskByIdForClientId(value?.task?.id, this.selectedClientDocData?.id, {isArchived: true});
          this.openSnackBar(`Task '${value?.task?.name}' archived successfully`, 'success');
        } catch (error) {
          this.openSnackBar('Error in task archival: ' + error.message, 'error');
          console.log(error.message);
        }
      }
    });
  }

  async unarchiveTask(task) {
    try {
      await this.firestoreService.updateTaskByIdForClientId(task?.id, this.selectedClientDocData?.id, {isArchived: false});
      this.openSnackBar(`Task '${task?.name}' unarchived successfully`, 'success');
    } catch (error) {
      this.openSnackBar('Error in task archival: ' + error.message, 'error');
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
    if (this.areUnArchivedTasksShown()) {
      this.fetchUnarchivedTasks();
    } else {
      this.fetchAllArchivedTasks();
    }
  }

  fetchUnarchivedTasks() {
    this.tasksList = [];
    this.archivedTasksSubscription?.unsubscribe();
    this.unarchivedTasksSubscription = this.firestoreService
      .getAllUnarchivedTasksForClientId(this.selectedClientDocData.id)
      .subscribe((tasksList) => {
        this.tasksList = tasksList.map((task) => {
          if (task.taskGroups && task.taskGroups.length > 0) {
            task.taskGroups = task.taskGroups.join(',');
          }
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

        this.tasksList.sort((taskA: any, taskB: any) => {
          return taskA.name < taskB.name ? -1 : taskA.name > taskB.name ? 1 : 0;
        });
        this.dataSource = new MatTableDataSource(this.tasksList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchAllArchivedTasks() {
    this.tasksList = [];
    this.unarchivedTasksSubscription?.unsubscribe();
    this.archivedTasksSubscription = this.firestoreService
      .getAllArchivedTasksForClientId(this.selectedClientDocData.id)
      .subscribe((tasksList) => {
        this.tasksList = tasksList.map((task) => {
          if (task.taskGroups && task.taskGroups.length > 0) {
            task.taskGroups = task.taskGroups.join(',');
          }
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

        this.tasksList.sort((taskA: any, taskB: any) => {
          return taskA.name < taskB.name ? -1 : taskA.name > taskB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.tasksList);
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

  areArchivedTasksShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedTasksShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}
