import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from "rxjs";
import {AuthService} from "../../services/auth.service";
import {SNACKBAR_CLASSES} from "../../common/utils/utils";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FirestoreService} from "../../services/firestore.service";
import {MatButtonModule} from '@angular/material/button';
import {MatTableDataSource} from "@angular/material/table";
import {ClientMainAttributes} from "../../common/interfaces/client-interfaces";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-client-user-profile',
  templateUrl: './client-user-profile.component.html',
  styleUrls: ['./client-user-profile.component.scss',
    '../../common/styles/listing.scss']
})
export class ClientUserProfileComponent implements OnInit, OnDestroy {
  clientAttributesReadableMap: Map<string, string> = new Map([
    ['clientId', 'Client ID'],
    ['clientName', 'Client Name'],
    ['role', 'Role']
  ]);

  columnsToDisplay: string[] = [
    'clientId',
    'clientName',
    'role'
  ];
  columnsHeadersToDisplay: string[] = [
    'clientId',
    'clientName',
    'role'
  ];
  dataSource: MatTableDataSource<ClientMainAttributes>;

  private loggedInUserFromAuthServiceSubscription: Subscription;
  private loggedInUserDocData: any;
  name: string;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private authService: AuthService,
              private snackBar: MatSnackBar,
              private firestoreService: FirestoreService) {
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
        this.name = userDocData.name;
        this.dataSource = new MatTableDataSource(this.loggedInUserDocData.clients);
        this.dataSource.sort = this.sort;
      });
  }

  async updateUser() {
    if (!this.name || !this.name?.trim()) {
      this.openSnackBar('Name is a mandatory field!', 'error');
      return;
    }

    if (this.name.trim() === this.loggedInUserDocData.name){
      this.openSnackBar('No changes to save!', 'error');
      return;
    }

    try {
      await this.firestoreService.updateUserById(this.loggedInUserDocData.id, {
        name: this.name.trim()
      });
      this.openSnackBar('Name is changed successfully!', 'success');
    } catch(error){
      this.openSnackBar('Error in saving user name:' + error.message, 'error');
    }
  }

  openSnackBar(message, type, duration?) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: duration ? duration : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }


    ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
  }

}
