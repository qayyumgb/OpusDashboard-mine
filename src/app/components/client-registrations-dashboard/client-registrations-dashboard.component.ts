import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';

import {ActivitySession, Column} from '../../common/interfaces/new-table-interfaces';
import {AuthService} from '../../services/auth.service';
import {FirestoreService} from '../../services/firestore.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ClientInContextService} from "../../services/client-in-context.service";
import {Subscription} from 'rxjs';
import * as moment from 'moment/moment';
import {RegistrationMainAttributes} from '../../common/interfaces/clock-interfaces';
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import {ConfirmationDialogComponent} from "../utility/confirmation-dialog/confirmation-dialog.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {EditRegistrationDialogComponent} from './edit-registration-dialog/edit-registration-dialog.component';
import {MatTooltipModule, TooltipPosition} from '@angular/material/tooltip';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-client-registrations-dashboard',
  templateUrl: './client-registrations-dashboard.component.html',
  styleUrls: ['./client-registrations-dashboard.component.scss'],
})
export class ClientRegistrationsDashboardComponent implements OnInit, OnDestroy {
  tabIndex = 0;

  links = ['Tasks', 'Presences'];
  activeLink = this.links[0];

  dateToday: Date = new Date();
  selectedDate: Date;

  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(private authService: AuthService,
              private firestoreService: FirestoreService,
              private router: Router,
              private clientInContextService: ClientInContextService,
              public route: ActivatedRoute) {
    const url = this.router.url;

    switch (url) {
      case '/dashboard/registrations/tasks':
        this.tabIndex = 0;
        break;
      case '/dashboard/registrations/presences':
        this.tabIndex = 1;
        break;
    }
  }


  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }
}

