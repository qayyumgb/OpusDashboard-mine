import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FirestoreService } from '../../services/firestore.service';
import {
  TrainingMainAttributes,
  TrainingRemainingAttributes,
} from '../../common/interfaces/training-interfaces';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { EditTrainingDialogComponent } from '../dev-training/edit-training-dialog/edit-training-dialog.component';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';


@Component({
  selector: 'app-client-training',
  templateUrl: './client-training.component.html',
  styleUrls: [
    './client-training.component.scss',
    '../../common/styles/listing.scss',
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ClientTrainingComponent implements AfterViewInit {
  datePipe = new DatePipe('en-US');
  clientId: string;

  trainingsAttributesReadableMap: Map<string, string> = new Map([
    ['creationTimestamp', 'Created'],
    ['workerId', 'Worker ID'],
    ['deviceId', 'Device ID'],
  ]);

  trainingsRemainingAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['activityTableState', 'Activity State'],
    ['clientName', 'Client Name'],
    ['trainingTableState', 'Training state'],
    ['activityType', 'Activity Type'],
    ['modelName', 'Model'],
    ['dataSet', 'Dataset'],
    ['activityTable', 'Activity Table'],
    ['activityState', 'Activity State'],
    ['activityRecordTimestamp', 'Activity Record Timestamp'],
    ['trainingTable', 'Training Table'],
    ['trainingState', 'Training State'],
    ['trainingRecordTimestamp', 'Training Record Timestamp'],
    ['labeledTable', 'Labeled Table'],
    ['labeledTableState', 'Labeled Table State'],
    ['outputTable', 'Output Table'],
    ['outputTableState', 'Output Table State'],
    ['notes', 'Notes'],
    ['youtubeLink', 'YouTube'],
  ]);
  columnsToDisplay: string[] = ['creationTimestamp', 'workerId', 'deviceId'];

  columnsHeadersToDisplay: string[] = [
    'creationTimestamp',
    'workerId',
    'deviceId',
    'edit',
  ];

  dateColumns: string[] = [
    'creationTimestamp',
    'activityRecordTimestamp',
    'trainingRecordTimestamp',
  ];

  dataSource: MatTableDataSource<TrainingMainAttributes>;
  expandedElement: TrainingRemainingAttributes | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public trainingsList: [];

  constructor(
    public firestoreService: FirestoreService,
    private dialog: MatDialog,
    public route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.route.paramMap.subscribe((params) => {
      this.clientId = params.get('id');
      this.firestoreService
        .getAllTrainingsForClientId(this.clientId)
        .subscribe((trainings) => {
          this.trainingsList = trainings.map((training) => {
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
                !['clientId', 'deviceId', 'modelId', 'workerId'].includes(
                  key
                )
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
            remainingAttributesList.sort((n1, n2) =>
              n1 > n2 ? 1 : n1 < n2 ? -1 : 0
            );

            const url = `${labeledTable}/trainingdashboard`;

            return {
              ...training,
              remainingAttributesList,
              url,
            };
          });

          this.dataSource = new MatTableDataSource(this.trainingsList);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
    });
  }

  ngAfterViewInit() {}

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openEditDialog(trainingRecord) {
    const dialogConfig = new MatDialogConfig();
    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      trainingRecord,
    };
    this.dialog.open(EditTrainingDialogComponent, dialogConfig);
  }

  openSnackBar(message) {
    this.snackBar.open(message, '', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
