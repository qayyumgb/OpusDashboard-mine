import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FirestoreService } from '../../services/firestore.service';
import {
  ClientMainAttributes,
  ClientRemainingAttributes,
} from '../../common/interfaces/client-interfaces';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-dev-client',
  templateUrl: './dev-client.component.html',
  styleUrls: [
    './dev-client.component.scss',
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
export class DevClientComponent implements AfterViewInit, OnDestroy {
  clientAttributesReadableMap: Map<string, string> = new Map([
    ['id', 'ID'],
    ['name', 'Name'],
    ['notes', 'Notes'],
  ]);

  clientRemainingAttributesReadableMap: Map<string, string> = new Map([
    ['userPermissions', 'User Permissions'],
  ]);
  columnsToDisplay: string[] = ['id', 'name', 'notes'];
  dataSource: MatTableDataSource<ClientMainAttributes>;
  expandedElement: ClientRemainingAttributes | null;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public clientList: [];
  getAllClientsSubscription: Subscription;

  constructor(public firestoreService: FirestoreService) {
    this.getAllClientsSubscription = this.firestoreService.getAllClients().subscribe((clients) => {
      this.clientList = clients.map((client) => {
        const remainingAttributesList: any[] = [];
        for (const [key, value] of Object.entries(client)) {
          if (!this.columnsToDisplay.includes(key)) {
            remainingAttributesList.push([
              this.clientRemainingAttributesReadableMap.get(key),
              value,
            ]);
          }
        }
        return {
          ...client,
          remainingAttributesList,
        };
      });

      this.dataSource = new MatTableDataSource(this.clientList);
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

  ngOnDestroy(): void {
    this.getAllClientsSubscription?.unsubscribe();
  }
}
