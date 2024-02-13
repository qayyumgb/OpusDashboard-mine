import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-client-training-dashboard',
  templateUrl: './client-training-dashboard.component.html',
  styleUrls: ['./client-training-dashboard.component.scss'],
})
export class ClientTrainingDashboardComponent implements OnInit, OnDestroy {
  clientId: string;
  trainingId: string;
  url: any;

  constructor(
    private router: Router,
    public route: ActivatedRoute,
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private dom: DomSanitizer
  ) {
    this.route.paramMap.subscribe((params) => {
      this.clientId = params.get('client_id');
      this.trainingId = params.get('training_id');

      const urlParams = {
        datasetId: this.clientId,
        tableId: this.trainingId,
      };
      const paramsAsString = JSON.stringify(urlParams);
      const encodedParams = encodeURIComponent(paramsAsString);
      const raportId = '441dba4b-0836-4acc-ad1f-7b8da2444c06';
      const pageId = '7BruB';
      const url = `https://datastudio.google.com/embed/reporting/${raportId}/page/${pageId}?params=${encodedParams}`;

      console.log(`url: ${url}`);

      this.url = this.dom.bypassSecurityTrustResourceUrl(url);
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
