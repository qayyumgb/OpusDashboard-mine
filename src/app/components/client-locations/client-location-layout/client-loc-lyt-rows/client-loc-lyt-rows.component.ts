import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTooltipModule, TooltipPosition} from '@angular/material/tooltip';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import {FirestoreService} from '../../../../services/firestore.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {Subscription} from 'rxjs';
import {RowMainAttributes} from "../../../../common/interfaces/device-interfaces";
import {AuthService} from "../../../../services/auth.service";
import {ClientInContextService} from "../../../../services/client-in-context.service";

@Component({
  selector: 'app-client-loc-lyt-rows',
  templateUrl: './client-loc-lyt-rows.component.html',
  styleUrls: ['./client-loc-lyt-rows.component.scss']
})
export class ClientLocLytRowsComponent implements OnInit, OnDestroy {
  @Input() locationId: string;
  @Input() clientId: string;
  @Input() layoutId: string;
  public rowList: RowMainAttributes[];

  rowAttributesSchema: any = {
    rowReference: 'number',
    rowNumber: 'text',
    rowLength: 'number',
    activityId: 'text',
    varietyId: 'text',
    labelIds: 'text'
  }

  rowAttributesReadableMap: Map<string, string> = new Map([
    ['rowReference', 'Reference'],
    ['rowNumber', 'Row Number'],
    ['rowLength', 'Row Length'],
    ['activityId', 'Activity'],
    ['varietyId', 'Variety'],
    ['labelIds', 'Labels']
  ]);

  columnsToDisplay: string[] = ['rowReference', 'rowNumber', 'rowLength', 'activityId', 'varietyId', 'labelIds'];
  columnsHeadersToDisplay: string[] = ['rowReference', 'rowNumber', 'rowLength', 'activityId', 'varietyId', 'labelIds', 'edit'];
  allActivitiesList: any[];
  allVarietiesList: any[];
  allLabelsList: any[];

  dataSource: MatTableDataSource<RowMainAttributes>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  activityListSubscription: Subscription;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  hasAdminRole: boolean;
  private allRowsSubscription: Subscription;
  private rowIndexesBeingSaved: number[] = [];
  varietyListSubscription: Subscription;
  labelListSubscription: Subscription;

  constructor(private firestoreService: FirestoreService,
              private authService: AuthService,
              private clientInContextService: ClientInContextService) {
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnInit(): void {
    this.activityListSubscription = this.firestoreService
      .getAllActivities()
      .subscribe((activityList) => (this.allActivitiesList = activityList));
    this.varietyListSubscription = this.firestoreService
      .getAllUnarchivedVarietiesForClientId(this.selectedClientDocData.id)
      .subscribe((varietyList) =>
        (this.allVarietiesList = varietyList.sort((varietyA: any, varietyB: any) => {
          return varietyA.name?.toLowerCase() < varietyB.name?.toLowerCase() ? -1 :
            varietyA.name?.toLowerCase() > varietyB.name?.toLowerCase() ? 1 : 0;
        })));
    this.labelListSubscription = this.firestoreService
      .getAllUnarchivedLabelsForClientId(this.selectedClientDocData.id)
      .subscribe((labelsList) => (this.allLabelsList = labelsList));
    this.loadAllRows();
  }

  async deleteCurrentRow(row, index) {
    if (row.id) {
      await this.firestoreService.deleteRowForLytLocClientId(this.layoutId, this.locationId, this.clientId, row.id);
      this.loadAllRows();
    } else {
      this.rowList.splice(index, 1);
      this.dataSource = new MatTableDataSource(this.rowList);
    }
  }

  async saveRow(row) {
    await this.setRowFieldsToNumber(row);
    await this.handleActivityNVarietySelection(row);
    if (!row.id) {
      await this.firestoreService.createRowForLytLocClientId(this.layoutId, this.locationId, this.clientId, row);
      this.loadAllRows();
    } else {
      await this.firestoreService.updateRowForLytLocClientId(this.layoutId, this.locationId, this.clientId, row);
    }
  }

  async saveRowOnFocusOut(row, index) {
    await this.setRowFieldsToNumber(row);
    await this.handleActivityNVarietySelection(row);
    if (!row.id) {
      if (!this.rowIndexesBeingSaved.includes(index)) {
        this.rowIndexesBeingSaved.push(index);
        if (row.rowReference || row.rowNumber || row.rowLength || row.varietyId || row.activityId) { //atleast 1 field should be filled for row to be created
          await this.firestoreService.createRowForLytLocClientId(this.layoutId, this.locationId, this.clientId, row);
          this.rowIndexesBeingSaved = this.rowIndexesBeingSaved.filter(indexEntry => indexEntry !== index);
          this.loadAllRows();
        }
      }
    } else {
      await this.firestoreService.updateRowForLytLocClientId(this.layoutId, this.locationId, this.clientId, row);
    }
  }

  async setRowFieldsToNumber(row) {
    row.rowReference = row.rowReference && !isNaN(row.rowReference) ? +row.rowReference : null;
    row.rowLength = row.rowLength && !isNaN(row.rowLength) ? +row.rowLength : null;
  }

  async handleActivityNVarietySelection(row) {
    if (row.activityId && (row.activityId !== '-1')) {
      row.activityName = this.allActivitiesList.filter(activity => activity.id === row.activityId)[0]?.name;
    } else {
      row.activityId = null;
      row.activityName = null;
    }
    if (row.locationId && (row.locationId !== '-1')) {
      const location = await this.firestoreService.getLocationByIdForClientId(this.locationId, this.clientId);
      row.locationName = location.data().name;
    } else {
      row.locationId = null;
      row.locationName = null;
    }
    if (row.layoutId && (row.layoutId !== '-1')) {
      const layout = await this.firestoreService.getLayoutByIdForLocIdClientId(this.layoutId, this.locationId, this.clientId);
      row.layoutName = layout.data().name;
    } else {
      row.layoutId = null;
      row.layoutName = null;
    }
    if (row.varietyId && (row.varietyId !== '-1')) {
      row.varietyName = this.allVarietiesList.filter(variety => variety.id === row.varietyId)[0]?.name;
    } else {
      row.varietyId = null;
      row.varietyName = null;
    }
    if (row.labelIds && (row.labelIds.length > 0)) {
      row.labels = this.allLabelsList.filter(label => row.labelIds.includes(label.id)).map(label => label.name);
    } else {
      row.labelIds = null;
      row.labels = null;
    }

  }

  addNewEmptyRow() {
    const newRow: RowMainAttributes = {
      id: '',
      rowReference: null,
      rowNumber: null,
      rowLength: null,
      activityId: null,
      varietyId: null,
      labelIds: []
    };
    //this.rowList.push(newRow);
    this.dataSource.data.push(newRow);
    this.dataSource.data = this.dataSource.data;
    this.dataSource.paginator.lastPage();
  }

  loadAllRows() {
    this.allRowsSubscription = this.firestoreService
      .getAllRowsForLytLocClientId(this.layoutId, this.locationId, this.clientId)
      .subscribe((rowListQS) => {
        this.rowList = rowListQS?.docs?.map((rowSnapshot) => {
          const row = rowSnapshot.data();
          row.inputType = 'label';
          row.id = rowSnapshot.id;
          return {
            ...row
          };
        });
        this.rowList = this.rowList.sort((x, y) => (x.rowReference as any) - (y.rowReference as any));
        this.dataSource = new MatTableDataSource(this.rowList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.sortData = this.sortData();
        this.allRowsSubscription.unsubscribe();
      });
  }

  ngOnDestroy(): void {
    this.activityListSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.allRowsSubscription?.unsubscribe();
    this.varietyListSubscription?.unsubscribe();
    this.labelListSubscription?.unsubscribe();
  }

  sortData() {
    const sortFunction =
      (items: any[], sort: MatSort): any[] => {
        if (!sort.active || sort.direction === '') {
          return items;
        }
        return items.sort((a: any, b: any) => {
          let comparatorResult = 0;
          switch (sort.active) {
            case 'varietyId':
              comparatorResult = this.compare(a.varietyName, b.varietyName, sort.direction === 'asc');
              break;
            case 'activityid':
              comparatorResult = this.compare(a.activityName, b.activityName, sort.direction === 'asc');
              break;
            default:
              comparatorResult = this.compare(a[sort.active], b[sort.active], sort.direction === 'asc');
              break;
          }
          return comparatorResult;
        });
      };
    return sortFunction;
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
