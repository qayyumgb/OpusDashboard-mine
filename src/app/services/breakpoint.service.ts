import {Injectable} from '@angular/core';
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {BehaviorSubject, Subscription} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BreakpointService {
  bpSubscription: Subscription;
  screenSize$ = new BehaviorSubject('default');

  constructor(private breakpointObserver: BreakpointObserver) {
    this.bpSubscription = this.breakpointObserver.observe([Breakpoints.Tablet, Breakpoints.Handset])
      .subscribe(result => this.setScreenSize(result));
  }

  private setScreenSize(result) {
    //console.log(JSON.stringify(result, undefined, 4));
    if (this.breakpointObserver.isMatched('(max-width: 501px)')) {
      this.screenSize$.next('below-501');
      console.log('BPS: below-501');
    } else if (this.breakpointObserver.isMatched('(max-width: 781px)')) {
      this.screenSize$.next('below-781');
      console.log('BPS: below-781');
    } else if (this.breakpointObserver.isMatched('(max-width: 1001px)')) {
      this.screenSize$.next('below-1001');
      console.log('BPS: below-1001');
    } /*else if (this.breakpointObserver.isMatched(Breakpoints.Handset)) {
      this.screenSize$.next('handset');
      console.log('BPS: handset');
    }*/ else {
      this.screenSize$.next('default');
      console.log('BPS: default');
    }
  }

}
