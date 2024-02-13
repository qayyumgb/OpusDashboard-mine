import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-edit-worker-group-dialog',
  templateUrl: './edit-worker-group-dialog.component.html',
  styleUrls: ['./edit-worker-group-dialog.component.scss']
})
export class EditWorkerGroupDialogComponent implements OnInit, OnDestroy {
  editWorkerGroupForm: UntypedFormGroup;

  workerGroupRecordBeingEdited: any;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditWorkerGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.workerGroupRecordBeingEdited = data.workerGroupRecord;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnInit() {
    this.editWorkerGroupForm = this.fb.group({
      name: [this.workerGroupRecordBeingEdited.name, [Validators.required]]
    });
  }

  async updateWorkerGroup() {
    if (!this.editWorkerGroupForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editWorkerGroupForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editWorkerGroupForm?.value?.name && this.editWorkerGroupForm?.value?.name?.trim() === '') {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const workerGroupDataToUpdate = this.editWorkerGroupForm.value;
    workerGroupDataToUpdate.name = workerGroupDataToUpdate.name?.trim();

    try {
      await this.firestoreService
        .updateWorkerGroupByIdForClientId(this.workerGroupRecordBeingEdited.id, this.selectedClientDocData.id, workerGroupDataToUpdate);
      this.openSnackBar('Changes have been saved', 'success');
      this.editWorkerGroupForm.markAsPristine();
      this.dialogRef.close();
    } catch (error) {
      this.openSnackBar('Error in saving changes:' + error.message, 'error');
      console.log(error.message);
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
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


