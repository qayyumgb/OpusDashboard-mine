import {Component, OnDestroy} from '@angular/core';
import {Subscription} from "rxjs";
import {ClientInContextService} from "../../services/client-in-context.service";

@Component({
  selector: 'app-client-apis',
  templateUrl: './client-apis.component.html',
  styleUrls: ['./client-apis.component.scss']
})
export class ClientApisComponent implements OnDestroy {

  apiKey: string;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(private clientInContextService: ClientInContextService) {
    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
      this.apiKey = selectedClientDocData.apiKey;
    });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
  }

}
