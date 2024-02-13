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
  selector: 'app-edit-label-dialog',
  templateUrl: './edit-label-dialog.component.html',
  styleUrls: ['./edit-label-dialog.component.scss']
})
export class EditLabelDialogComponent implements OnInit, OnDestroy {
  editLabelForm: UntypedFormGroup;

  labelRecordBeingEdited: any;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditLabelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.labelRecordBeingEdited = data.labelRecord;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnInit() {
    this.editLabelForm = this.fb.group({
      name: [this.labelRecordBeingEdited.name, [Validators.required]],
    });
  }

  async updateLabel() {
    if (!this.editLabelForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editLabelForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editLabelForm?.value?.name && this.editLabelForm?.value?.name?.trim() === '') {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const labelDataToUpdate = this.editLabelForm.value;
    labelDataToUpdate.name = labelDataToUpdate.name?.trim();

    try {
      await this.firestoreService
        .updateLabelByIdForClientId(this.labelRecordBeingEdited.id, this.selectedClientDocData.id, labelDataToUpdate);
      this.openSnackBar('Changes have been saved', 'success');
      this.editLabelForm.markAsPristine();
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

