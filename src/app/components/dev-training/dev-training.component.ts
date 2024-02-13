import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {FirestoreService} from '../../services/firestore.service';
import {
  TrainingMainAttributes,
  TrainingRemainingAttributes,
} from '../../common/interfaces/training-interfaces';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {EditTrainingDialogComponent} from './edit-training-dialog/edit-training-dialog.component';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import {SNACKBAR_CLASSES} from "../../common/utils/utils";
import {Subscription} from "rxjs";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-dev-training',
  templateUrl: './dev-training.component.html',
  styleUrls: [
    './dev-training.component.scss',
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
export class DevTrainingComponent implements AfterViewInit, OnDestroy {
  unArchivedVsArchived = 'unarchived';
  datePipe = new DatePipe('en-US');

  trainingsAttributesReadableMap: Map<string, string> = new Map([
    ['creationTimestamp', 'Created'],
    ['description', 'Description'],
    ['workerName', 'Worker Name'],
    ['clientName', 'Client Name']
  ]);

  trainingsRemainingAttributesReadableMap: Map<string, string> = new Map([
    ['notes', 'Notes'],
    ['trainingKey', 'Training Key']
  ]);

  columnsToDisplay: string[] = ['creationTimestamp', 'description', 'workerName', 'clientName'];

  columnsHeadersToDisplay: string[] = [
    'creationTimestamp',
    'description',
    'workerName',
    'clientName',
    'edit',
  ];

  dateColumns: string[] = [
    'creationTimestamp',
    'activityRecordTimestamp',
    'trainingRecordTimestamp',
  ];

  dataSource: MatTableDataSource<TrainingMainAttributes>;
  expandedElement: any = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public trainingsList: [];
  private archivedTrainingsSubscription: Subscription;
  private unarchivedTrainingsSubscription: Subscription;
  private loggedInUserFromAuthServiceSubscription: Subscription;
  private loggedInUserDocData: any;

  constructor(public firestoreService: FirestoreService,
              private dialog: MatDialog,
              public route: ActivatedRoute,
              private snackBar: MatSnackBar,
              private router: Router,
              private authService: AuthService) {
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
        this.fetchUnarchivedTrainings();
      });

  }

  ngAfterViewInit() {
  }

  applyFilter($event) {
    const filterValue = ($event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  editAnnotationLink(trainingRecord) {
    return `/annotations/${trainingRecord.id}`;
  }

  async archiveTraining(trainingRecord) {
    try {
      await this.firestoreService.archiveUnarchiveTraining(trainingRecord.id, true);
      this.openSnackBar(`Training with key ${trainingRecord.id} has been archived successfully`, 'success');
    } catch (error) {
      this.openSnackBar(`Training with key ${trainingRecord.id} could not be archived due to an error:${error.message}`, 'success');
    }
  }

  async unarchiveTraining(trainingRecord) {
    try {
      await this.firestoreService.archiveUnarchiveTraining(trainingRecord.id, false);
      this.openSnackBar(`Training with key ${trainingRecord.id} has been un-archived successfully`, 'success');
    } catch (error) {
      this.openSnackBar(`Training with key ${trainingRecord.id} could not be un-archived due to an error:${error.message}`, 'success');
    }
  }

  toggleArchived() {
    if (this.areUnArchivedTrainingsShown()) {
      this.fetchUnarchivedTrainings();
    } else {
      this.fetchArchivedTrainings();
    }
  }

  fetchUnarchivedTrainings() {
    this.archivedTrainingsSubscription?.unsubscribe();
    this.unarchivedTrainingsSubscription = this.firestoreService.getUnArchivedTrainings(this.loggedInUserDocData.clientIds).subscribe((trainings) => {
      this.trainingsList = trainings.map((training) => {
        training.trainingId = training.id;
        const remainingAttributesList: any[] = [];
        let dataset = '';
        let labeledTable = '';
        for (const [key, value] of Object.entries(training)) {
          if (this.dateColumns.includes(key) && value !== null) {
            const timeValue = value as Timestamp;
            training[key] = this.datePipe.transform(
              timeValue.toMillis(),
              'yyyy-MM-dd HH:mm'
            );
          }
          if (
            key &&
            !this.columnsToDisplay.includes(key) &&
            ['notes', 'trainingKey'].includes(key)
          ) {
            remainingAttributesList.push([
              this.trainingsRemainingAttributesReadableMap.get(key),
              training[key],
            ]);
            if (key === 'dataSet') {
              dataset = training[key];
            }
            if (key === 'labeledTable') {
              labeledTable = training[key];
            }
          }
        }

        if (!training.hasOwnProperty('notes')) {
          remainingAttributesList.push([this.trainingsRemainingAttributesReadableMap.get('notes'), '']);
        }

        remainingAttributesList.sort((n1, n2) =>
          n1 > n2 ? 1 : n1 < n2 ? -1 : 0
        );

        return {
          ...training,
          remainingAttributesList,
        };
      });

      this.dataSource = new MatTableDataSource(this.trainingsList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  fetchArchivedTrainings() {
    this.unarchivedTrainingsSubscription?.unsubscribe();
    this.archivedTrainingsSubscription = this.firestoreService.getAllArchivedTrainings(this.loggedInUserDocData.clientIds).subscribe((trainings) => {
      this.trainingsList = trainings.map((training) => {
        training.trainingId = training.id;
        const remainingAttributesList: any[] = [];
        let dataset = '';
        let labeledTable = '';
        for (const [key, value] of Object.entries(training)) {
          if (this.dateColumns.includes(key) && value !== null) {
            const timeValue = value as Timestamp;
            training[key] = this.datePipe.transform(
              timeValue.toMillis(),
              'yyyy-MM-dd HH:mm'
            );
          }
          if (
            key &&
            !this.columnsToDisplay.includes(key) &&
            ['notes'].includes(key)
          ) {
            remainingAttributesList.push([
              this.trainingsRemainingAttributesReadableMap.get(key),
              training[key],
            ]);
            if (key === 'dataSet') {
              dataset = training[key];
            }
            if (key === 'labeledTable') {
              labeledTable = training[key];
            }
          }
        }

        if (!training.hasOwnProperty('notes')) {
          remainingAttributesList.push([this.trainingsRemainingAttributesReadableMap.get('notes'), '']);
        }

        remainingAttributesList.sort((n1, n2) =>
          n1 > n2 ? 1 : n1 < n2 ? -1 : 0
        );

        return {
          ...training,
          remainingAttributesList,
        };
      });

      this.dataSource = new MatTableDataSource(this.trainingsList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  openSnackBar(message, type, duration?) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: duration ? duration : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.archivedTrainingsSubscription?.unsubscribe();
    this.unarchivedTrainingsSubscription?.unsubscribe();
  }

  areArchivedTrainingsShown() {
    return (this.unArchivedVsArchived === 'archived');
  }

  areUnArchivedTrainingsShown() {
    return (this.unArchivedVsArchived === 'unarchived');
  }

  downloadAsCSV(type) {
    const filename = `${type}`
    if (!this.trainingsList || (this.trainingsList.length === 0)) {
      return;
    }
    const csvData = this.ConvertToCSV(this.trainingsList);
    const blob = new Blob(['\ufeff' + csvData], {type: 'text/csv;charset=utf-8;'});
    const dwldLink = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
      dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", filename + ".csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  ConvertToCSV(objArray) {
    const csvHeaderList = ['id', 'clientId', 'clientName', 'workerId', 'workerName', 'notes',
      'description', 'videoId', 'deviceId', 'startTimeDisabled', 'trainingStartTimestamp',
      'videoStartTimeInRealTime', 'creationTimestamp', 'updationTimestamp', 'updatedAt', 'isArchived'];

    const csvHeaderReadableMap: Map<string, string> = new Map([
      ['id', 'Training ID'],
      ['clientId', 'Client ID'],
      ['clientName', 'Client Name'],
      ['workerId', 'Worker ID'],
      ['workerName', 'Worker Name'],
      ['notes', 'Notes'],
      ['description', 'Description'],
      ['videoId', 'Video ID'],
      ['deviceId', 'Device ID'],
      ['startTimeDisabled', 'Start Time Disabled'],
      ['trainingStartTimestamp', 'Training Start Timestamp'],
      ['videoStartTimeInRealTime', 'Video Start Time In Real-Time'],
      ['creationTimestamp', 'Creation Timestamp'],
      ['updationTimestamp', 'Updation Timestamp'],
      ['updatedAt', 'Updated At'],
      ['isArchived', 'isArchived']
    ]);

    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = '';

    for (const header of csvHeaderList) {
      row += csvHeaderReadableMap.get(header) + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const [counter, header] of csvHeaderList.entries()) {
        if (['notes', 'description'].includes(header)) {
          const newLineCharsRemovedStr = (array[i][header] ?? '').replace(/\n/g, " ");
          const doubleQuotesEscapedStr = newLineCharsRemovedStr.replace(/"/g, '\\"');
          line += `"` + doubleQuotesEscapedStr + `"`;
        } else if (['trainingStartTimestamp', 'videoStartTimeInRealTime', 'updatedAt'].includes(header)) {
          const dateValue = array[i][header] ? this.datePipe.transform(
            (array[i][header] as Timestamp).toMillis(),
            'yyyy-MM-dd HH:mm'
          ) : '';
          line += `"` + dateValue + `"`;
        } else {
          line += (array[i][header] ?? '');
        }
        if (counter < csvHeaderList.length) {
          line += ','
        }
      }
      str += line + '\r\n';
    }
    return str;
  }

  expandRow(element: any) {
    this.expandedElement = this.expandedElement?.trainingId === element.trainingId ? null : element;
  }

  applyExpandedClass(element: any) {
    return this.expandedElement?.trainingId === element.trainingId;
  }
}
