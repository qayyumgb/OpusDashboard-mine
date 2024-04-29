import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormField} from '@angular/material/form-field';
import {AuthService} from '../../services/auth.service';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../services/firestore.service';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {ClientInContextService} from '../../services/client-in-context.service';
import {environment} from '../../../environments/environment';

//import {PresenceService} from "../../presence.service";

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit, OnDestroy {
  public loggedInUserFromAuthServiceSubscription: Subscription;
  public loggedInUserDocData: any;
  clientSubscription: Subscription;
  clientInContextDocData: any;
  selectedClientId: string;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  clientLocationsSubscription: Subscription;
  clientLocationsList: any[];
  selectedClientLocationId = '-1';
  url: string;

  constructor(
    public authService: AuthService,
    public firestoreService: FirestoreService,
    public route: ActivatedRoute,
    private router: Router,
    public clientInContextService: ClientInContextService,
    //  public presenceService: PresenceService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        //console.log(JSON.stringify(event));
        // Hide loading indicator
        const urlAfterRedirects = event.urlAfterRedirects;
        this.url = urlAfterRedirects.substring(1, urlAfterRedirects.length);
      }
    });
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
        if (this.loggedInUserDocData) {
          if (!this.clientInContextService.clientInContext && this.loggedInUserDocData.clients && (this.loggedInUserDocData.clients.length > 0)) {
            this.clientSubscription = firestoreService
              .getClientById(this.loggedInUserDocData.lastClientIdSelected
                ? this.loggedInUserDocData.lastClientIdSelected : this.loggedInUserDocData.clients[0].clientId)
              .subscribe((clientDocData) => {
                this.clientInContextDocData = clientDocData;
                this.selectedClientId = clientDocData.id;
                const clientElementInUserDoc = this.loggedInUserDocData?.clients.filter(client => client.clientId === clientDocData.id);
                if (clientElementInUserDoc && clientElementInUserDoc.length > 0) {
                  this.clientInContextDocData.role = clientElementInUserDoc[0]?.role;
                }
                this.clientInContextService.clientInContextSubject.next(this.clientInContextDocData);
                this.firestoreService.updateUserById(this.loggedInUserDocData.id, {lastClientIdSelected: clientDocData.id});
                this.clientSubscription?.unsubscribe();

                this.clientLocationsSubscription = firestoreService.getAllLocationsForClientId(this.selectedClientId).subscribe(locations => {
                  this.clientLocationsList = locations?.sort((locA: any, locB: any) => {
                    return locA.name?.toLowerCase() < locB.name?.toLowerCase() ? -1 : locA.name?.toLowerCase() > locB.name?.toLowerCase() ? 1 : 0;
                  });
                  if (this.clientLocationsList.length === 1) {
                    this.selectedClientLocationId = this.clientLocationsList[0].id;
                  } else {
                    const prevSelectedLocMap = this.loggedInUserDocData.prevSelectedLocMap;
                    this.selectedClientLocationId = prevSelectedLocMap && prevSelectedLocMap[this.selectedClientDocData.id] ?
                      prevSelectedLocMap[this.selectedClientDocData.id] : '-1';
                  }
                });
              });
          }
        }
      }
    );

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(clientInContext => {
      this.selectedClientDocData = clientInContext;
      if (!this.selectedClientDocData) {
        return;
      }
      this.clientLocationsSubscription = firestoreService.getAllLocationsForClientId(this.selectedClientDocData.id).subscribe(locations => {
        this.clientLocationsList = locations?.sort((locA: any, locB: any) => {
          return locA.name?.toLowerCase() < locB.name?.toLowerCase() ? -1 : locA.name?.toLowerCase() > locB.name?.toLowerCase() ? 1 : 0;
        });
        if (this.clientLocationsList.length === 1) {
          this.selectedClientLocationId = this.clientLocationsList[0].id;
        } else {
          const prevSelectedLocMap = this.loggedInUserDocData.prevSelectedLocMap;
          this.selectedClientLocationId = prevSelectedLocMap && prevSelectedLocMap[this.selectedClientDocData.id] ?
            prevSelectedLocMap[this.selectedClientDocData.id] : '-1';
          if (this.selectedClientId === '-1') {
            this.clientInContextService.clientLocSubject.next(null);
          } else {
            this.clientInContextService.clientLocSubject.next(this.clientLocationsList.filter(loc => loc.id === this.selectedClientLocationId)[0]);
          }
        }
      });
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.clientLocationsSubscription?.unsubscribe();
  }

  onClientChange(clientId) {
    this.clientSubscription = this.firestoreService
      .getClientById(clientId)
      .subscribe((clientDocData) => {
        this.clientInContextDocData = clientDocData;
        this.selectedClientId = clientDocData.id;
        const clientElementInUserDoc = this.loggedInUserDocData?.clients.filter(client => client.clientId === clientDocData.id);
        if (clientElementInUserDoc && clientElementInUserDoc.length > 0) {
          this.clientInContextDocData.role = clientElementInUserDoc[0]?.role;
        }
        this.clientInContextService.clientInContextSubject.next(this.clientInContextDocData);
        this.firestoreService.updateUserById(this.loggedInUserDocData.id, {lastClientIdSelected: clientDocData.id});
        this.clientSubscription?.unsubscribe();
        this.router.navigate(['/sign-in']);
      });
  }

  onClientLocationChange(locationId: string) {
    this.selectedClientLocationId = locationId;
    let prevSelectedMapToUpdate: any;
    if (this.loggedInUserDocData.prevSelectedLocMap) {
      prevSelectedMapToUpdate = this.loggedInUserDocData.prevSelectedLocMap;
    } else {
      prevSelectedMapToUpdate = {};
    }
    if (locationId !== '-1') {
      prevSelectedMapToUpdate[this.selectedClientDocData.id] = locationId;
    } else {
      delete prevSelectedMapToUpdate[this.selectedClientDocData.id];
    }
    this.firestoreService.updateUserById(this.loggedInUserDocData.id, {prevSelectedLocMap: prevSelectedMapToUpdate});
    this.clientInContextService.clientLocSubject.next(this.clientLocationsList.filter(loc => loc.id === locationId)[0]);
  }

  getInitials(nameString) {
    if (!nameString) {
      return '';
    }
    if (nameString.indexOf(' ') === -1) {
      return nameString.charAt(0).toUpperCase();
    } else {
      const fullName = nameString.split(' ');
      const initials = fullName.shift().charAt(0) + fullName.pop().charAt(0);
      return initials.toUpperCase();
    }
  }

  locationDropDownIsVisible() {
    return (
      this.url?.startsWith('dashboard/labor/trolley') ||
      this.url?.startsWith('dashboard/labor/productivity') ||
      this.url?.startsWith('dashboard/labor/performance') ||
      this.url?.startsWith('dashboard/labor/presences') ||
      this.url?.startsWith('dashboard/labor/overview') ||
      this.url?.startsWith('dashboard/productivity/rowmap') ||
      this.url?.startsWith('dashboard/productivity/row') ||
      this.url?.startsWith('dashboard/productivity/variety')
    );
  }

  locationDropDownIsDisabled() {
    return (this.clientLocationsList?.length === 1);
  }

  openClockWeb() {
    if (environment.production) {
      window.open('https://clock.opuswatch.nl', '_blank');
    } else {
      //window.location.href = 'https://dev.clock.opuswatch.nl'
      window.open('https://dev.clock.opuswatch.nl', '_blank');
    }

  }
}
