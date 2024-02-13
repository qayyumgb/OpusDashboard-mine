import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {ConfirmationDialogComponent} from '../utility/confirmation-dialog/confirmation-dialog.component';
import {SNACKBAR_CLASSES} from '../../common/utils/utils';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import {CreatePositionDialogComponent} from "./create-position-dialog/create-position-dialog.component";
import {EditPositionDialogComponent} from "./edit-position-dialog/edit-position-dialog.component";
import {PositionMainAttributes} from "../../common/interfaces/clock-interfaces";

@Component({
  selector: 'app-client-positions',
  templateUrl: './client-positions.component.html',
  styleUrls: ['./client-positions.component.scss',
    '../../common/styles/listing.scss',]
})
export class ClientPositionsComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  positionAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['name', 'Name'],
    ['locationName', 'Location'],
    ['creationTimestamp', 'Created At'],
  ]);

  screenSize = 'default';

  columnsToDisplay: string[] = ['id', 'name', 'locationName', 'creationTimestamp'];
  columnsHeadersToDisplay: string[] = [
    'name',
    'locationName',
    'creationTimestamp',
    'Edit',
  ];
  dataSource: MatTableDataSource<PositionMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  positionsList: any[];
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unarchivedPositionsSubscription: Subscription;
  archivedPositionsSubscription: Subscription;
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
      this.fetchUnarchivedPositions();
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
    this.dialog.open(CreatePositionDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      positionRecord: record
    };

    this.dialog.open(EditPositionDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.archivedPositionsSubscription?.unsubscribe();
    this.unarchivedPositionsSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  async archivePosition(position) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive position '${position?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        position
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.updatePositionByIdForClientId(value?.position?.id, this.selectedClientDocData?.id, {isArchived: true});
          this.openSnackBar(`Position '${value?.position?.name}' archived successfully`, 'success');
        } catch (error) {
          this.openSnackBar('Error in position archival: ' + error.message, 'error');
          console.log(error.message);
        }
      }
    });
  }

  async unarchivePosition(position) {
    try {
      await this.firestoreService.updatePositionByIdForClientId(position?.id, this.selectedClientDocData?.id, {isArchived: false});
      this.openSnackBar(`Position '${position?.name}' unarchived successfully`, 'success');
    } catch (error) {
      this.openSnackBar('Error in position archival: ' + error.message, 'error');
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
    if (this.areUnArchivedPositionsShown()) {
      this.fetchUnarchivedPositions();
    } else {
      this.fetchAllArchivedPositions();
    }
  }

  fetchUnarchivedPositions() {
    this.positionsList = [];
    this.archivedPositionsSubscription?.unsubscribe();
    this.unarchivedPositionsSubscription = this.firestoreService
      .getAllUnarchivedPositionsForClientId(this.selectedClientDocData.id)
      .subscribe((positionsList) => {
        this.positionsList = positionsList.map((position) => {
          for (const [key, value] of Object.entries(position)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              position[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return position;
        });

        this.positionsList.sort((positionA: any, positionB: any) => {
          return positionA.name < positionB.name ? -1 : positionA.name > positionB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.positionsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchAllArchivedPositions() {
    this.positionsList = [];
    this.unarchivedPositionsSubscription?.unsubscribe();
    this.archivedPositionsSubscription = this.firestoreService
      .getAllArchivedPositionsForClientId(this.selectedClientDocData.id)
      .subscribe((positionsList) => {
        this.positionsList = positionsList.map((position) => {
          for (const [key, value] of Object.entries(position)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              position[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return position;
        });

        this.positionsList.sort((positionA: any, positionB: any) => {
          return positionA.name < positionB.name ? -1 : positionA.name > positionB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.positionsList);
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

  areArchivedPositionsShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedPositionsShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}
