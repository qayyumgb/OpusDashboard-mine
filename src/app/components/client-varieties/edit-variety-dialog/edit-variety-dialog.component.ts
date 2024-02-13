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
  selector: 'app-edit-variety-dialog',
  templateUrl: './edit-variety-dialog.component.html',
  styleUrls: ['./edit-variety-dialog.component.scss']
})
export class EditVarietyDialogComponent implements OnInit, OnDestroy {
  editVarietyForm: UntypedFormGroup;

  varietyRecordBeingEdited: any;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditVarietyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.varietyRecordBeingEdited = data.varietyRecord;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnInit() {
    this.editVarietyForm = this.fb.group({
      name: [this.varietyRecordBeingEdited.name, [Validators.required]],
    });
  }

  async updateVariety() {
    if (!this.editVarietyForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editVarietyForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editVarietyForm?.value?.name && this.editVarietyForm?.value?.name?.trim() === '') {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const varietyDataToUpdate = this.editVarietyForm.value;
    varietyDataToUpdate.name = varietyDataToUpdate.name?.trim();

    try {
      await this.firestoreService
        .updateVarietyByIdForClientId(this.varietyRecordBeingEdited.id, this.selectedClientDocData.id, varietyDataToUpdate);
      this.openSnackBar('Changes have been saved', 'success');
      this.editVarietyForm.markAsPristine();
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

