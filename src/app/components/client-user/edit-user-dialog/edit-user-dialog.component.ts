import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {ClientInContextService} from '../../../services/client-in-context.service';
import {AuthService} from '../../../services/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {SNACKBAR_CLASSES} from '../../../common/utils/utils';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit, OnDestroy {
  editUserForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;

  userRecordBeingEdited: any;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  languagesList: any[];
  allWorkersList: any[];
  workerListSubscription: Subscription;


  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.userRecordBeingEdited = data.userRecord;
    this.languagesList = data.languagesList;
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      }
    );

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;

      this.workerListSubscription = this.firestoreService.getUnArchivedWorkersForClientId(selectedClientDocData.id).subscribe((workersList) => {
        this.allWorkersList = workersList.sort((worker1, worker2) => {
          return worker1.name.toLowerCase() > worker2.name.toLowerCase() ? 1 : worker1.name.toLowerCase() < worker2.name.toLowerCase() ? -1 : 0;
        });
      });

    });
  }

  ngOnInit() {
    this.editUserForm = this.fb.group({
      name: [this.userRecordBeingEdited.name, [Validators.required]],
      notes: [this.userRecordBeingEdited.notes, []],
      role: [this.userRecordBeingEdited.role, []],
      languageCode: [this.userRecordBeingEdited.languageCode, []],
      associatedWorkerId: [this.userRecordBeingEdited.associatedWorkerId, []]
    });
  }

  async updateUser() {
    if (!this.editUserForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editUserForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editUserForm?.value?.name && this.editUserForm?.value?.name?.trim() === '') {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const userDataToUpdate = this.editUserForm.value;
    userDataToUpdate.name = userDataToUpdate.name?.trim();

    if (userDataToUpdate.associatedWorkerId) {
      userDataToUpdate.associatedWorkerName = this.allWorkersList.filter(worker => worker.id === userDataToUpdate.associatedWorkerId)[0]?.name;
      userDataToUpdate.associatedWorkerClientId = this.selectedClientDocData.id;
    }

    this.firestoreService
      .updateUserByIdForClientId(this.userRecordBeingEdited.id, userDataToUpdate, this.selectedClientDocData.id)
      .subscribe({
        next: async (apiResponse) => {
          if (apiResponse.success) {
            this.openSnackBar('Changes have been saved', 'success');
            this.editUserForm.markAsPristine();
            this.dialogRef.close();
          } else if (apiResponse.success === false) {
            this.openSnackBar('Error in user creation:' + apiResponse.error, 'error');
          }
        },
        error: (error) => {
          this.openSnackBar('Error in saving changes:' + error.message, 'error');
          console.log(error.message);
        }
      });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.workerListSubscription?.unsubscribe();
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
