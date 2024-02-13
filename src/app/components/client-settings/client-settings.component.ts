import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTab, MatTabBody, MatTabGroup, MatTabHeader, MatTabsModule} from '@angular/material/tabs';
import {ClientInContextService} from "../../services/client-in-context.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-client-settings',
  templateUrl: './client-settings.component.html',
  styleUrls: ['./client-settings.component.scss',
    '../../common/styles/listing.scss']
})
export class ClientSettingsComponent implements OnInit, OnDestroy {
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  rootUrl = '/settings';

  navigation = [
    {
      name: 'General',
      link: '/general',
    },
    {
      name: 'User Profile',
      link: '/userprofile',
    },
    {
      name: 'Locations',
      link: '/locations',
    },
    {
      name: 'Users',
      link: '/users',
    },
    {
      name: 'Workers',
      link: '/workers',
    },
    {
      name: 'Worker Groups',
      link: '/workergroups',
    },
    {
      name: 'Varieties',
      link: '/varieties',
    },
    {
      name: 'Presences',
      link: '/presences',
    },
    {
      name: 'Labels',
      link: '/labels',
    },
    {
      name: 'Tasks',
      link: '/tasks',
    },
    {
      name: 'Task Groups',
      link: '/taskgroups',
    },
    {
      name: 'Positions',
      link: '/positions',
    },
    {
      name: 'Devices',
      link: '/devices',
    }
  ];

  constructor(private clientInContextService: ClientInContextService, private route: ActivatedRoute, public router: Router) {
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      if (this.selectedClientDocData?.hasAdminRole) {
        this.navigation.push({
          name: 'Apis',
          link: '/apis',
        })
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
  }

}
