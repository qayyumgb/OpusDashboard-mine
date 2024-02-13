import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss'],
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  clientId: string;
  clientDocData: any;
  clientSubscription: Subscription;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;

  constructor(
    private router: Router,
    public route: ActivatedRoute,
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {
    this.route.paramMap.subscribe((params) => {
      this.clientId = params.get('id');
      this.clientSubscription = firestoreService
        .getClientById(this.clientId)
        .subscribe((clientDocData) => {
          this.clientDocData = clientDocData;
        });
    });

    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.clientSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
  }
}
