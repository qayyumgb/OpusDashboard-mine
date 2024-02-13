import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivateDeviceDialogComponent } from '../client-device/activate-device-dialog/activate-device-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FirestoreService } from '../../services/firestore.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  DeviceMainAttributes,
  DeviceRemainingAttributes,
} from '../../common/interfaces/device-interfaces';
import { DatePipe } from '@angular/common';
import firebase from 'firebase/compat/app';
import {Timestamp} from 'firebase/firestore';

@Component({
  selector: 'app-device',
  templateUrl: './dev-device.component.html',
  styleUrls: [
    './dev-device.component.scss',
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
export class DevDeviceComponent implements AfterViewInit {
  datePipe = new DatePipe('en-US');

  deviceAttributesReadableMap: Map<string, string> = new Map([
    ['name', 'Name'],
    ['workerName', 'Worker'],
    ['activityName', 'Activity'],
    ['state', 'State'],
    ['clientName', 'Client'],
  ]);

  deviceRemainingAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['trainingKey', 'Training Key'],
    ['creationTimestamp', 'Creation Timestamp'],
    ['trainingMode', 'Training Mode'],
    ['notes', 'Notes'],
  ]);
  columnsToDisplay: string[] = [
    'name',
    'workerName',
    'activityName',
    'clientName',
    'state',
  ];
  dateColumns: string[] = [
    'creationTimestamp',
    'activityRecordTimestamp',
    'trainingRecordTimestamp',
  ];
  dataSource: MatTableDataSource<DeviceMainAttributes>;
  expandedElement: DeviceRemainingAttributes | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public deviceList: [];

  constructor(
    public firestoreService: FirestoreService,
    private dialog: MatDialog
  ) {
    this.firestoreService.getAllDevices().subscribe((devicesList) => {
      this.deviceList = devicesList.map((device) => {
        const remainingAttributesList: any[] = [];
        for (const [key, value] of Object.entries(device)) {
          if (this.dateColumns.includes(key)) {
            const timeValue = value as Timestamp;
            device[key] = this.datePipe.transform(
              timeValue.toMillis(),
              'yyyy-MM-dd HH:mm'
            );
          }
          if (
            key &&
            !this.columnsToDisplay.includes(key) &&
            ![
              'activationKey',
              'activityId',
              'workerId',
              'clientId',
            ].includes(key)
          ) {
            remainingAttributesList.push([
              this.deviceRemainingAttributesReadableMap.get(key),
              device[key],
            ]);
          }
        }
        remainingAttributesList.sort((n1, n2) =>
          n1 > n2 ? 1 : n1 < n2 ? -1 : 0
        );
        return {
          ...device,
          remainingAttributesList,
        };
      });

      this.dataSource = new MatTableDataSource(this.deviceList);
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

  openDialog() {
    const dialogConfig = new MatDialogConfig();

    //dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      /*id: 1,
            title: ''*/
    };

    this.dialog.open(ActivateDeviceDialogComponent, dialogConfig);
  }
}
