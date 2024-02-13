import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormField} from '@angular/material/form-field';
import {AuthService} from '../../services/auth.service';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../services/firestore.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ClientInContextService} from '../../services/client-in-context.service';
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

  constructor(
    public authService: AuthService,
    public firestoreService: FirestoreService,
    public route: ActivatedRoute,
    private router: Router,
    public clientInContextService: ClientInContextService,
  //  public presenceService: PresenceService
  ) {
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
              });
          }
        }
      }
    );

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(clientInContext => {
      this.selectedClientDocData = clientInContext;
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
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
}
