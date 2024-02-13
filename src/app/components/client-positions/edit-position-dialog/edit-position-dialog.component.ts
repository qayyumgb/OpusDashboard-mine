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
  selector: 'app-edit-position-dialog',
  templateUrl: './edit-position-dialog.component.html',
  styleUrls: ['./edit-position-dialog.component.scss']
})
export class EditPositionDialogComponent implements OnInit, OnDestroy {
  editPositionForm: UntypedFormGroup;

  positionRecordBeingEdited: any;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  allLocationsList: any[];
  locationListSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditPositionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.positionRecordBeingEdited = data.positionRecord;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => (this.allLocationsList = locationsList));
    });
  }

  ngOnInit() {
    this.editPositionForm = this.fb.group({
      name: [this.positionRecordBeingEdited.name, [Validators.required]],
      locationId: [this.positionRecordBeingEdited.locationId, []],
    });
  }

  async updatePosition() {
    if (!this.editPositionForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editPositionForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editPositionForm?.value?.name && this.editPositionForm?.value?.name?.trim() === '') {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const positionDataToUpdate = this.editPositionForm.value;
    positionDataToUpdate.name = positionDataToUpdate.name?.trim();

    if (positionDataToUpdate.locationId) {
      positionDataToUpdate.locationName = this.allLocationsList
        .filter((location) => location.id === positionDataToUpdate.locationId)
        .map((location) => (location.name ? location.name : null))[0];
    } else {
      positionDataToUpdate.locationName = null;
    }

    try {
      await this.firestoreService
        .updatePositionByIdForClientId(this.positionRecordBeingEdited.id, this.selectedClientDocData.id, positionDataToUpdate);
      this.openSnackBar('Changes have been saved', 'success');
      this.editPositionForm.markAsPristine();
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
    this.locationListSubscription.unsubscribe();
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

