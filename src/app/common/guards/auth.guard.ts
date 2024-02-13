import {Injectable} from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import {merge, Observable, concat, combineLatest, Subscription, repeatWhen, skipUntil, skipWhile, filter} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {map, take, tap} from 'rxjs/operators';
import {ClientInContextService} from '../../services/client-in-context.service';
import {FirestoreService} from "../../services/firestore.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  private clientSubscription: Subscription;

  constructor(
    private authService: AuthService,
    private clientInContextService: ClientInContextService,
    private router: Router,
    private firestoreService: FirestoreService
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const mergedObservable = combineLatest([this.authService.loggedInUserFromAuthService$, this.clientInContextService.clientInContextSubject]).pipe(
      map(([userDocData, clientDocData]) => {
        if (userDocData && clientDocData) {
          return {userDocData, clientDocData}
        } else if (userDocData) {
          if (!this.clientInContextService.clientInContext && userDocData.clients && (userDocData.clients.length > 0)) {
            this.clientSubscription = this.firestoreService
              .getClientById(userDocData.lastClientIdSelected
                ? userDocData.lastClientIdSelected : userDocData.clients[0].clientId)
              .subscribe((clientFromDB) => {
                const clientElementInUserDoc = userDocData?.clients.filter(client => client.clientId === clientFromDB.id);
                if (clientElementInUserDoc && clientElementInUserDoc.length > 0) {
                  clientFromDB.role = clientElementInUserDoc[0]?.role;
                }
                this.clientInContextService.clientInContextSubject.next(clientFromDB);
                return {userDocData, clientDocData: clientFromDB}
              });
          }
        } else {
          return {userDocData: null, clientDocData: null}
        }
      })
    )


    return mergedObservable
      .pipe(
        filter(combined => {
          return (combined !== undefined) && !!(combined?.userDocData && combined?.clientDocData)
        }),
        take(1),
        map(combined => {
          if (combined?.clientDocData && combined?.userDocData && !route.data?.isDeveloperRoute) {
            const userClientRoleMap = combined.userDocData.clients.filter(client => client.clientId === combined.clientDocData.id)[0];
            this.clientSubscription?.unsubscribe();
            return !!combined.userDocData && route.data.roles.includes(userClientRoleMap.role);
          } else if (route.data?.isDeveloperRoute) {
            this.clientSubscription?.unsubscribe();
            return combined.userDocData.type === 'developer';
          }
        })
      );
  }
}
