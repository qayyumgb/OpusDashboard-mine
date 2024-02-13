import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FirestoreService } from '../../services/firestore.service';
import { WorkerMainAttributes } from '../../common/interfaces/worker-interfaces';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-worker',
  templateUrl: './dev-worker.component.html',
  styleUrls: [
    './dev-worker.component.scss',
    '../../common/styles/listing.scss',
  ],
})
export class DevWorkerComponent implements AfterViewInit {
  workerAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['name', 'Name'],
    ['clientName', 'Client'],
    ['notes', 'Notes'],
    ['creationTimestamp', 'Created At'],
  ]);

  columnsToDisplay: string[] = [
    'id',
    'name',
    'clientName',
    'notes',
    'creationTimestamp',
  ];
  dataSource: MatTableDataSource<WorkerMainAttributes>;
  dateColumns: string[] = ['creationTimestamp'];
  datePipe = new DatePipe('en-US');

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public workerList: [];

  constructor(public firestoreService: FirestoreService) {
    this.firestoreService.getAllWorkers().subscribe((workers) => {
      this.workerList = workers.map((worker) => {
        for (const [key, value] of Object.entries(worker)) {
          if (this.dateColumns.includes(key)) {
            const timeValue = value as Timestamp;
            worker[key] = this.datePipe.transform(
              timeValue.toMillis(),
              'yyyy-MM-dd HH:mm'
            );
          }
        }
        return {
          ...worker,
        };
      });

      this.dataSource = new MatTableDataSource(this.workerList);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
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
}
