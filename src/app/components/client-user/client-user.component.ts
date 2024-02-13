import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {FirestoreService} from "../../services/firestore.service";
import {AuthService} from "../../services/auth.service";
import {ActivatedRoute} from "@angular/router";
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {ClientInContextService} from "../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatTableDataSource} from "@angular/material/table";
import {CreateUserDialogComponent} from "./create-user-dialog/create-user-dialog.component";
import {EditUserDialogComponent} from "./edit-user-dialog/edit-user-dialog.component";
import {ConfirmationDialogComponent} from "../utility/confirmation-dialog/confirmation-dialog.component";
import {Subscription} from "rxjs";
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import {DatePipe} from "@angular/common";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {UserMainAttributes} from "../../common/interfaces/user-interfaces";
import {SNACKBAR_CLASSES} from "../../common/utils/utils";
import {BreakpointService} from "../../services/breakpoint.service";

@Component({
  selector: 'app-client-user',
  templateUrl: './client-user.component.html',
  styleUrls: ['./client-user.component.scss',
    '../../common/styles/listing.scss',]
})
export class ClientUserComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  userAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['name', 'Name'],
    ['notes', 'Notes'],
    ['role', 'Role'],
    ['creationTimestamp', 'Created At'],
  ]);

  screenSize = 'default';

  columnsToDisplay: string[] = ['id', 'name', 'notes', 'role', 'creationTimestamp'];
  columnsHeadersToDisplay: string[] = [
    'name',
    'notes',
    'role',
    'creationTimestamp',
    'Edit',
  ];
  dataSource: MatTableDataSource<UserMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  userList: any[];
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unarchivedUsersSubscription: Subscription;
  archivedUsersSubscription: Subscription;
  breakpointSubscription: Subscription;
  filterValue: string;

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
      this.fetchUnarchivedUsers();
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
    this.dialog.open(CreateUserDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      userRecord: record
    };

    this.dialog.open(EditUserDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.archivedUsersSubscription?.unsubscribe();
    this.unarchivedUsersSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  archiveUser(user) {
    if (user.id === this.loggedInUserDocData.id) {
      this.openSnackBar('You cannot deactivate yourself!', 'error');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive user '${user?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        user
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        this.firestoreService.archiveUserByIdForClientId(value?.user?.id, this.selectedClientDocData?.id).subscribe({
          next: async (apiResponse) => {
            if (apiResponse.success) {
              this.openSnackBar(`User '${value?.user?.name}' archived successfully`, 'success');
            } else if (apiResponse.success === false) {
              this.openSnackBar('Error in user archival:' + apiResponse.error, 'error');
            }
          },
          error: (error) => {
            this.openSnackBar('Error in user archival: ' + error.message, 'error');
            console.log(error.message);
          }
        });
      }
    });
  }

  unarchiveUser(user) {
    this.firestoreService.unarchiveUserByIdForClientId(user?.id, this.selectedClientDocData?.id).subscribe({
      next: async (apiResponse) => {
        if (apiResponse.success) {
          this.openSnackBar(`User '${user?.name}' unarchived successfully`, 'success');
        } else if (apiResponse.success === false) {
          this.openSnackBar('Error in unarchiving user:' + apiResponse.error, 'error');
        }
      },
      error: (error) => {
        this.openSnackBar('Error in user archival: ' + error.message, 'error');
        console.log(error.message);
      }
    });
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
    if (this.areUnArchivedUsersShown()) {
      this.fetchUnarchivedUsers();
    } else {
      this.fetchAllArchivedUsers();
    }
  }

  fetchUnarchivedUsers() {
    this.archivedUsersSubscription?.unsubscribe();
    this.unarchivedUsersSubscription = this.firestoreService
      .getAllUnarchivedUsersForClientId(this.selectedClientDocData.id)
      .subscribe((userList) => {
        this.userList = userList.map((user) => {
          for (const [key, value] of Object.entries(user)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              user[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }

          return {
            ...user,
            isArchived: false,
            role: user?.clients?.filter(client => client.clientId === this.selectedClientDocData.id)[0]?.role
          };
        });

        this.userList.sort((userA: any, userB: any) => {
          return userA.name < userB.name ? -1 : userA.name > userB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.userList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchAllArchivedUsers() {
    this.unarchivedUsersSubscription?.unsubscribe();
    this.archivedUsersSubscription = this.firestoreService
      .getAllArchivedUsersForClientId(this.selectedClientDocData.id)
      .subscribe((userList) => {
        this.userList = userList.map((user) => {
          for (const [key, value] of Object.entries(user)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              user[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }

          return {
            ...user,
            isArchived: true,
            role: user?.archivedClients?.filter(archivedClient => archivedClient.clientId === this.selectedClientDocData.id)[0]?.role
          };
        });

        this.userList.sort((userA: any, userB: any) => {
          return userA.name < userB.name ? -1 : userA.name > userB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.userList);
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

  areArchivedUsersShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedUsersShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}
