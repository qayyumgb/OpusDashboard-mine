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
import {VarietyMainAttributes} from '../../common/interfaces/variety-interfaces';
import {CreateVarietyDialogComponent} from './create-variety-dialog/create-variety-dialog.component';
import {EditVarietyDialogComponent} from './edit-variety-dialog/edit-variety-dialog.component';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';

@Component({
  selector: 'app-client-varieties',
  templateUrl: './client-varieties.component.html',
  styleUrls: ['./client-varieties.component.scss',
    '../../common/styles/listing.scss',]
})
export class ClientVarietiesComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  varietyAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['name', 'Name'],
    ['creationTimestamp', 'Created At'],
  ]);

  screenSize = 'default';

  columnsToDisplay: string[] = ['id', 'name', 'notes', 'role', 'creationTimestamp'];
  columnsHeadersToDisplay: string[] = [
    'name',
    'creationTimestamp',
    'Edit',
  ];
  dataSource: MatTableDataSource<VarietyMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  varietiesList: any[];
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unarchivedVarietiesSubscription: Subscription;
  archivedVarietiesSubscription: Subscription;
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
      this.fetchUnarchivedVarieties();
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
    this.dialog.open(CreateVarietyDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      varietyRecord: record
    };

    this.dialog.open(EditVarietyDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.archivedVarietiesSubscription?.unsubscribe();
    this.unarchivedVarietiesSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  async archiveVariety(variety) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive variety '${variety?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        variety
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.updateVarietyByIdForClientId(value?.variety?.id, this.selectedClientDocData?.id, {isArchived: true});
          this.openSnackBar(`Variety '${value?.variety?.name}' archived successfully`, 'success');
        } catch (error) {
          this.openSnackBar('Error in variety archival: ' + error.message, 'error');
          console.log(error.message);
        }
      }
    });
  }

  async unarchiveVariety(variety) {
    try {
      await this.firestoreService.updateVarietyByIdForClientId(variety?.id, this.selectedClientDocData?.id, {isArchived: false});
      this.openSnackBar(`Variety '${variety?.name}' unarchived successfully`, 'success');
    } catch (error) {
      this.openSnackBar('Error in variety archival: ' + error.message, 'error');
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
    if (this.areUnArchivedVarietiesShown()) {
      this.fetchUnarchivedVarieties();
    } else {
      this.fetchAllArchivedVarieties();
    }
  }

  fetchUnarchivedVarieties() {
    this.varietiesList = [];
    this.archivedVarietiesSubscription?.unsubscribe();
    this.unarchivedVarietiesSubscription = this.firestoreService
      .getAllUnarchivedVarietiesForClientId(this.selectedClientDocData.id)
      .subscribe((varietiesList) => {
        this.varietiesList = varietiesList.map((variety) => {
          for (const [key, value] of Object.entries(variety)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              variety[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return variety;
        });

        this.varietiesList.sort((varietyA: any, varietyB: any) => {
          return varietyA.name < varietyB.name ? -1 : varietyA.name > varietyB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.varietiesList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchAllArchivedVarieties() {
    this.varietiesList = [];
    this.unarchivedVarietiesSubscription?.unsubscribe();
    this.archivedVarietiesSubscription = this.firestoreService
      .getAllArchivedVarietiesForClientId(this.selectedClientDocData.id)
      .subscribe((varietiesList) => {
        this.varietiesList = varietiesList.map((variety) => {
          for (const [key, value] of Object.entries(variety)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              variety[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return variety;
        });

        this.varietiesList.sort((varietyA: any, varietyB: any) => {
          return varietyA.name < varietyB.name ? -1 : varietyA.name > varietyB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.varietiesList);
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

  areArchivedVarietiesShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedVarietiesShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}
