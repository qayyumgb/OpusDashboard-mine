import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-create-position-dialog',
  templateUrl: './create-position-dialog.component.html',
  styleUrls: ['./create-position-dialog.component.scss']
})
export class CreatePositionDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  description: string;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  allLocationsList: any[];
  locationListSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreatePositionDialogComponent>,
  @Inject(MAT_DIALOG_DATA) data) {

    this.description = data.description;

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

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      locationId: ['', []],
    });
  }

  async createPosition() {
    if (!this.form.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.form?.value?.name && (this.form?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const positionToCreate = this.form.value;
    positionToCreate.name = positionToCreate.name?.trim();

    if (positionToCreate.locationId) {
      positionToCreate.locationName = this.allLocationsList
        .filter((location) => location.id === positionToCreate.locationId)
        .map((location) => (location.name ? location.name : null))[0];
    } else {
      positionToCreate.locationName = null;
    }

    try {
      await this.firestoreService.createPositionForClientId(positionToCreate, this.selectedClientDocData.id);
      this.dialogRef.close(this.form.value);
      this.openSnackBar(`Position '${positionToCreate.name}' created successfully.`, 'success');
      this.form.reset();
    } catch (error) {
      this.openSnackBar('Error in position creation:' + error.message, 'error');
      console.log(error.message);
    }
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


