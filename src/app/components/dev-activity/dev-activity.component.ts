import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FirestoreService } from '../../services/firestore.service';
import { DatePipe } from '@angular/common';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';

export interface Activity {
  id: string;
  name: string;
  action: string;
  modelLocation: string;
  creationTimestamp: Date;
  notes: string;
}

export interface Parameters {
  params: [string, string];
}

@Component({
  selector: 'app-activity',
  templateUrl: './dev-activity.component.html',
  styleUrls: ['./dev-activity.component.scss', '../../common/styles/listing.scss'],
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
export class DevActivityComponent implements AfterViewInit {
  datePipe = new DatePipe('en-US');

  activitiesAttributesReadableMap: Map<string, string> = new Map([
    ['name', 'Name'],
    ['action', 'Action'],
    ['modelLocation', 'Model Location']
  ]);

  activitiesRemainingAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'Activity ID'],
    ['creationTimestamp', 'Creation Timestamp'],
    ['notes', 'Notes'],
  ]);


  dateColumns: string[] = [
    'creationTimestamp'
  ];

  columnsToDisplay: string[] = ['name', 'action', 'modelLocation'];
  dataSource: MatTableDataSource<Activity>;
  expandedElement: Parameters | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public activitiesList: [];

  constructor(public firestoreService: FirestoreService) {
    this.firestoreService.getAllActivities().subscribe((activitiesList) => {
      this.activitiesList = activitiesList.map((activity) => {
        const remainingAttributesList: any[] = [];
        for (const [key, value] of Object.entries(activity)) {
          if (this.dateColumns.includes(key)) {
            const timeValue = value as Timestamp;
            activity[key] = this.datePipe.transform(
                timeValue.toMillis(),
                'yyyy-MM-dd HH:mm'
            );
          }
          if (
              key &&
              !this.columnsToDisplay.includes(key)
          ) {
            remainingAttributesList.push([
              this.activitiesRemainingAttributesReadableMap.get(key),
              activity[key],
            ]);
          }
        }
        remainingAttributesList.sort((n1, n2) =>
            n1 > n2 ? 1 : n1 < n2 ? -1 : 0
        );
        return {
          ...activity,
          parameters: 'Click to See',
          remainingAttributesList
        };
      });

      this.dataSource = new MatTableDataSource(this.activitiesList);
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
