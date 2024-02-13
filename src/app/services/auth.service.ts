import {Injectable, NgZone} from '@angular/core';
import {ActivatedRoute, NavigationExtras, Router} from '@angular/router';

import firebase from 'firebase/compat/app';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/compat/firestore';

import {Observable, of, Subscription} from 'rxjs';
import {switchMap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  loggedInUserFromAuthService$: Observable<any>;
  isAnonymous: boolean;
  private loggedInUserFromAuthServiceSubscription: Subscription;
  private loggedInUserDocData: any;

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore,
              private router: Router,
              private route: ActivatedRoute) {
    this.loggedInUserFromAuthService$ = this.afAuth.authState.pipe(
        switchMap(user => {
          if (user) {
            this.isAnonymous = user.isAnonymous;
            return this.afs.doc<any>(`users/${user.uid}`).valueChanges({ idField: 'id' });
          } else {
            return of(null);
          }
        })
    );
    this.loggedInUserFromAuthServiceSubscription = this.loggedInUserFromAuthService$.subscribe(userDocData => {
      this.loggedInUserDocData = userDocData;
    });
  }

  // Users can have 3 roles - admin(type=client), manager(type=client), developer(type=developer)

  get isAuthenticated(): boolean {
    return this.loggedInUserFromAuthService$ !== null;
  }


  async emailPasswordSignIn(email, password) {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async resetPassword(email) {
    return this.afAuth.sendPasswordResetEmail(email)
  }

  async signOut() {
    this.afAuth.signOut().then(() => {

      console.log('signed out');
      this.router.navigate(['']);
    });
  }

}
