import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTab, MatTabBody, MatTabGroup, MatTabHeader, MatTabsModule} from '@angular/material/tabs';
import {ClientInContextService} from "../../services/client-in-context.service";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from '../../services/auth.service';

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

  authUserSubscription: Subscription;

  constructor(private clientInContextService: ClientInContextService, private route: ActivatedRoute, public router: Router, private authService: AuthService) {
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      if (this.selectedClientDocData.hasOwnProperty('hasAdminRole')) {
        if (this.selectedClientDocData?.hasAdminRole) {
          this.navigation.push({
            name: 'Apis',
            link: '/apis',
          })
        }
        if (this.selectedClientDocData?.isDeveloper) {
          this.navigation.push({
            name: 'Languages',
            link: '/languages',
          });
        }
      } else {
        this.authUserSubscription = this.authService.loggedInUserFromAuthService$.subscribe((userDocData: any) => {
          if (this.navigation.filter(element => element.name === 'Languages').length > 0) {
            return;
          }
          if (this.navigation.filter(element => element.name === 'Apis').length > 0) {
            return;
          }
          const clientSpecificRole = userDocData.clients.filter(client => client?.clientId === selectedClientDocData?.id)[0]?.role;
          const userHasAdminRole = ['admin'].includes(clientSpecificRole);
          const isDeveloper = userDocData.type === 'developer';
          if (userHasAdminRole) {
            this.navigation.push({
              name: 'Apis',
              link: '/apis',
            })
          }
          if (isDeveloper) {
            this.navigation.push({
              name: 'Languages',
              link: '/languages',
            })
          }
          this.authUserSubscription?.unsubscribe();
        });
      }
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.authUserSubscription?.unsubscribe();
  }

}
