import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {FirestoreService} from '../../../services/firestore.service';
import {AngularFireStorage} from '@angular/fire/compat/storage';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {TrainingRequestMainAttributes} from '../../../common/interfaces/training-request-interfaces';
import {DatePipe} from '@angular/common';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import * as moment from 'moment';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-training-data-requests',
  templateUrl: './training-data-requests.component.html',
  styleUrls: ['./training-data-requests.component.scss',
    '../../../common/styles/listing.scss',]
})
export class TrainingDataRequestsComponent implements AfterViewInit {
  datePipe = new DatePipe('en-US');

  trainingReqAttributesReadableMap: Map<string, string> = new Map([
    ['requestedAt', 'Requested Date'],
    ['requestType', 'Request Type'],
    ['lastStatusAt', 'Last Status At'],
    ['status', 'Status'],
    ['requestedBy', 'Requested By'],
    ['download', 'Download']
  ]);

  columnsToDisplay: string[] = [
    'requestedAt',
    'requestType',
    'lastStatusAt',
    'status',
    'requestedBy'
  ];

  columnsHeadersToDisplay: string[] = [
    'requestedAt',
    'requestType',
    'lastStatusAt',
    'status',
    'requestedBy',
    'download'
  ];

  dateColumns: string[] = [
    'requestedAt',
    'generatedAt',
    'processedNoDataAt'
  ];
  dataSource: MatTableDataSource<TrainingRequestMainAttributes>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public trainingDataRequests: [];
  trainingId: string;

  constructor(
    public firestoreService: FirestoreService,
    private dialog: MatDialog,
    private storage: AngularFireStorage,
    public route: ActivatedRoute,
  ) {
    this.route.paramMap.subscribe((params) => {
      this.trainingId = params.get('training_id');

      this.firestoreService.getAllTrainingDataRequestsForTrainingId(this.trainingId)
        .subscribe((trainingDataRequests) => {
          this.trainingDataRequests = trainingDataRequests.map((trainingDataRequest) => {
            for (const [key, value] of Object.entries(trainingDataRequest)) {
              if (this.dateColumns.includes(key)) {
                const timeValue = value as Timestamp;
                trainingDataRequest[key] = this.datePipe.transform(
                  timeValue.toMillis(),
                  'yyyy-MM-dd HH:mm'
                );
              }

              if (key === 'requestType') {
                if (trainingDataRequest[key] === 'TRAINING_DATA') {
                  trainingDataRequest[key] = 'Training Data';
                } else if (trainingDataRequest[key] === 'LABELED_TRAINING_DATA') {
                  trainingDataRequest[key] = 'Labeled Training Data';
                }
              }
            }

            trainingDataRequest.requestedBy = trainingDataRequest?.user?.name ?? '';
            if( trainingDataRequest?.status === 'generated'){
              trainingDataRequest.lastStatusAt = trainingDataRequest.generatedAt;
            } else if (trainingDataRequest?.status === 'processed-nodata'){
              trainingDataRequest.lastStatusAt = trainingDataRequest.processedNoDataAt;
            }
            trainingDataRequest.status = trainingDataRequest?.status?.toUpperCase();
            return trainingDataRequest;
          });

          this.trainingDataRequests.sort((a: TrainingRequestMainAttributes, b: TrainingRequestMainAttributes) => moment(b.requestedAt).isBefore(moment(a.requestedAt)) ? -1 : 1);
          this.dataSource = new MatTableDataSource(this.trainingDataRequests);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
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

  async downloadCSV(trainingDataRequest) {
    console.log('Fetching CSV...');
    const otherBucket = this.storage.storage.app.storage('training-data-exports')
    const ref = otherBucket.ref().child(`${trainingDataRequest.csvPathInBucket}`);
    const downloadUrl = await ref.getDownloadURL();
    const csvURL = downloadUrl;
    console.log(csvURL);
    const link = document.createElement('a');
    link.target = '_blank';
    link.href = csvURL;
    link.download = `training-data.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

}
