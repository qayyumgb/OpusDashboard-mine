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
import {CreateLabelDialogComponent} from "./create-label-dialog/create-label-dialog.component";
import {EditLabelDialogComponent} from "./edit-label-dialog/edit-label-dialog.component";
import {LabelMainAttributes} from "../../common/interfaces/label-interfaces";

@Component({
  selector: 'app-client-labels',
  templateUrl: './client-labels.component.html',
  styleUrls: ['./client-labels.component.scss',
    '../../common/styles/listing.scss',]
})
export class ClientLabelsComponent implements OnDestroy, AfterViewInit {
  unArchivedVsArchived = 'unarchived';
  labelAttributesReadableMap: Map<string, string> = new Map([
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
  dataSource: MatTableDataSource<LabelMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  labelsList: any[];
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  unarchivedLabelsSubscription: Subscription;
  archivedLabelsSubscription: Subscription;
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
      this.fetchUnarchivedLabels();
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
    this.dialog.open(CreateLabelDialogComponent, dialogConfig);
  }

  openEditDialog(record) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      labelRecord: record
    };

    this.dialog.open(EditLabelDialogComponent, dialogConfig);
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.archivedLabelsSubscription?.unsubscribe();
    this.unarchivedLabelsSubscription?.unsubscribe();
    this.breakpointSubscription?.unsubscribe();
  }

  async archiveLabel(label) {

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: `Are you sure want to archive label '${label?.name ?? ''}' ?`,
        buttonText: {
          ok: 'Archive',
          cancel: 'Cancel'
        },
        label
      }
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (value.decision) {
        try {
          await this.firestoreService.updateLabelByIdForClientId(value?.label?.id, this.selectedClientDocData?.id, {isArchived: true});
          this.openSnackBar(`Label '${value?.label?.name}' archived successfully`, 'success');
        } catch (error) {
          this.openSnackBar('Error in label archival: ' + error.message, 'error');
          console.log(error.message);
        }
      }
    });
  }

  async unarchiveLabel(label) {
    try {
      await this.firestoreService.updateLabelByIdForClientId(label?.id, this.selectedClientDocData?.id, {isArchived: false});
      this.openSnackBar(`Label '${label?.name}' unarchived successfully`, 'success');
    } catch (error) {
      this.openSnackBar('Error in label archival: ' + error.message, 'error');
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
    if (this.areUnArchivedLabelsShown()) {
      this.fetchUnarchivedLabels();
    } else {
      this.fetchAllArchivedLabels();
    }
  }

  fetchUnarchivedLabels() {
    this.labelsList = [];
    this.archivedLabelsSubscription?.unsubscribe();
    this.unarchivedLabelsSubscription = this.firestoreService
      .getAllUnarchivedLabelsForClientId(this.selectedClientDocData.id)
      .subscribe((labelList) => {
        this.labelsList = labelList.map((label) => {
          for (const [key, value] of Object.entries(label)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              label[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return label;
        });

        this.labelsList.sort((labelA: any, labelB: any) => {
          return labelA.name < labelB.name ? -1 : labelA.name > labelB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.labelsList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.initiateFiltering();
      });
  }

  fetchAllArchivedLabels() {
    this.labelsList = [];
    this.unarchivedLabelsSubscription?.unsubscribe();
    this.archivedLabelsSubscription = this.firestoreService
      .getAllArchivedLabelsForClientId(this.selectedClientDocData.id)
      .subscribe((labelsList) => {
        this.labelsList = labelsList.map((label) => {
          for (const [key, value] of Object.entries(label)) {
            if (this.dateColumns.includes(key)) {
              const timeValue = value as Timestamp;
              label[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
              );
            }
          }
          return label;
        });

        this.labelsList.sort((labelA: any, labelB: any) => {
          return labelA.name < labelB.name ? -1 : labelA.name > labelB.name ? 1 : 0;
        });

        this.dataSource = new MatTableDataSource(this.labelsList);
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

  areArchivedLabelsShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedLabelsShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }
}
