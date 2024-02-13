import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { tap, map, switchMap, first } from 'rxjs/operators';
import { of } from 'rxjs';
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class PresenceService {

  constructor(private afAuth: AngularFireAuth, private realtimeDb: AngularFireDatabase, private router: Router) {
    console.log('let there be presence');
    this.updateOnUser().subscribe();
    this.updateOnDisconnect().subscribe();
    this.updateOnAway();
  }

  getUser() {
    return this.afAuth.authState.pipe(first()).toPromise();
  }


  async setPresence(status: string) {
    console.log('.........setPresence');
    const user = await this.getUser();
    if (user) {
      return this.realtimeDb.object(`status/${user.uid}`).update({ status, timestamp: new Date() });
    }
  }

  updateOnUser() {
    console.log('.........updateOnUser');
    const connection = this.realtimeDb.object('.info/connected').valueChanges().pipe(
      map(connected => connected ? 'online' : 'offline')
    );

    return this.afAuth.authState.pipe(
      switchMap(user =>  user ? connection : of('offline')),
      tap(status => this.setPresence(status))
    );
  }

  updateOnDisconnect() {
    console.log('.........updateOnDisconnect');
    return this.afAuth.authState.pipe(
      tap(user => {
        if (user) {
          this.realtimeDb.object(`status/${user.uid}`).query.ref.onDisconnect()
            .update({
              status: 'offline',
              timestamp: new Date()
            });
        }
      })
    );
  }

  updateOnAway() {
    document.onvisibilitychange = (e) => {

      if (document.visibilityState === 'hidden') {
        this.setPresence('away');
      } else {
        this.setPresence('online');
      }
    };
  }

  async signOut() {
    await this.setPresence('offline');
    await this.afAuth.signOut().then(() => {

      console.log('signed out');
      this.router.navigate(['']);
    });
  }

}
