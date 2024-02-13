import { Injectable } from '@angular/core';
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
    if (this.breakpointObserver.isMatched(Breakpoints.Tablet)) {
      this.screenSize$.next('tablet');
      //console.log('BPS: tablet');
    } else if(this.breakpointObserver.isMatched(Breakpoints.Handset)) {
      this.screenSize$.next('handset');
      //console.log('BPS: handset');
    } else {
      this.screenSize$.next('default');
      //console.log('BPS: default');
    }
  }

}
