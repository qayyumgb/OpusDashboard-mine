import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";
import firebase from 'firebase/compat/app';
import UserCredential = firebase.auth.UserCredential;

@Component({
  selector: 'app-create-user-dialog',
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss']
})
export class CreateUserDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  description: string;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.description = data.description;

    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(userDocData => {
      this.loggedInUserDocData = userDocData;
    });

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required]],
      notes: ['', []],
      role: ['regular', []],
    });
  }

  async createUser() {
    if (!this.form.valid) {
      this.openSnackBar('Name & email are mandatory', 'error');
      return;
    }

    if (this.form?.value?.name && (this.form?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    if (this.form?.value?.email && (this.form?.value?.email?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Email', 'error');
      return;
    }

    const userToCreate = this.form.value;
    userToCreate.clientId = this.selectedClientDocData?.id;
    userToCreate.name = userToCreate.name?.trim();
    userToCreate.email = userToCreate.email?.trim();
    this.firestoreService
      .createUserForClientId(userToCreate, this.selectedClientDocData)
      .subscribe({
        next: async (apiResponse) => {
          if (apiResponse.success) {
            this.dialogRef.close(this.form.value);
            await this.authService.resetPassword(userToCreate.email);
            this.openSnackBar(`User '${userToCreate.name}' created successfully. Reset password email sent to user.`, 'success');
            this.form.reset();
          } else if (apiResponse.success === false) {
            this.openSnackBar('Error in user creation:' + apiResponse.error, 'error');
          }
        },
        error: (error) => {
          this.openSnackBar('Error in user creation:' + error.message, 'error');
          console.log(error.message);
        }
      });
  }

  close() {
    this.dialogRef.close();
  }

  openSnackBar(message, type) {
    this.snackBar.open(message, '', {
      panelClass: SNACKBAR_CLASSES[type],
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}

