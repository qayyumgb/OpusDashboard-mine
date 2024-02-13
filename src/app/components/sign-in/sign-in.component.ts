import {Component, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import {UntypedFormGroup, UntypedFormControl} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit, OnDestroy {
  public form: UntypedFormGroup = new UntypedFormGroup({
    email: new UntypedFormControl(''),
    password: new UntypedFormControl(''),
  });

  @Output() submitEM = new EventEmitter();
  loggedInUserFromAuthServcSubConstuctor: Subscription;
  loggedInUserFromAuthServiceSubscription: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loggedInUserFromAuthServcSubConstuctor = this.authService.loggedInUserFromAuthService$.subscribe((userRecord) => {
      if (userRecord.type === 'developer' && (!userRecord.clients || userRecord.clients.length === 0)) {
        this.router.navigate([`trainings`]);
      } else if (userRecord.email === 'info@jacoudijk.nl') {
        this.router.navigate([`/dashboard/rowmap`]);
      } else {
        if (userRecord.lastDashboardOpened) {
          if (userRecord.lastDashboardOpened === 'productivity') {
            this.router.navigate([`/dashboard/productivity`]);
          } else if (userRecord.lastDashboardOpened === 'labor') {
            this.router.navigate([`/dashboard/labor`]);
          } else if (userRecord.lastDashboardOpened === 'observations') {
            this.router.navigate([`/dashboard/observations`]);
          } else if (userRecord.lastDashboardOpened === 'registrations') {
            this.router.navigate([`/dashboard/registrations`]);
          } else if (userRecord.lastDashboardOpened === 'sessions') {
            this.router.navigate([`/dashboard/sessions`]);
          }
        } else {
          this.router.navigate([`/dashboard/productivity`]);
        }
      }
    });
  }

  ngOnInit(): void {
  }

  async submit() {
    if (this.form.valid) {
      this.submitEM.emit(this.form.value);
    }

    if (!this.form.value?.email?.trim() || !this.form.value?.password?.trim()) {
      this.snackBar.open('Please enter both email and password!', '', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    try {
      await this.authService.emailPasswordSignIn(
        this.form.value.email,
        this.form.value.password
      );
      this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe((userRecord) => {
        if (userRecord.type === 'developer' && (!userRecord.clients || userRecord.clients.length === 0)) {
          this.router.navigate([`trainings`]);
        } else {
          if (userRecord.lastDashboardOpened) {
            if (userRecord.lastDashboardOpened === 'productivity') {
              this.router.navigate([`/dashboard/productivity`]);
            } else if (userRecord.lastDashboardOpened === 'labor') {
              this.router.navigate([`/dashboard/labor`]);
            } else if (userRecord.lastDashboardOpened === 'observations') {
              this.router.navigate([`/dashboard/observations`]);
            } else if (userRecord.lastDashboardOpened === 'registrations') {
              this.router.navigate([`/dashboard/registrations`]);
            } else if (userRecord.lastDashboardOpened === 'sessions') {
              this.router.navigate([`/dashboard/sessions`]);
            }
          } else {
            this.router.navigate([`/dashboard/productivity`]);
          }
        }
      });
    } catch (error) {
      let errorMessage;
      if (error?.code === 'auth/invalid-email') {
        errorMessage = `Please pass a valid email value`;
      } else {
        errorMessage = 'Incorrect login credentials entered!';
      }
      this.snackBar.open(errorMessage, '', {
        duration: 6000,
        panelClass: ['snackbar-error'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  async initiatePasswordRecovery($event) {
    $event?.stopPropagation();
    $event?.preventDefault();
    const formValue = this.form.value;
    if (!formValue.email) {
      this.snackBar.open('Email needs to be filled-in to initiate password recovery', '', {
        duration: 6000,
        panelClass: ['snackbar-error'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }
    const email = formValue.email.trim();
    try {
      await this.authService.resetPassword(email);
    } catch (error) {
      let errorMessage = `An error occurred while resetting password for ${email}. Please try again!`;
      if (error?.code === 'auth/user-not-found') {
        errorMessage = `Email '${email}' not found`;
      } else if (error?.code === 'auth/invalid-email') {
        errorMessage = `Please pass a valid email value`;
      }
      this.snackBar.open(errorMessage, '', {
        duration: 6000,
        panelClass: ['snackbar-error'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }
    this.snackBar.open(`Password reset email sent to ${email}`, '', {
      duration: 5000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.loggedInUserFromAuthServcSubConstuctor?.unsubscribe();
  }
}
