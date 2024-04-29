import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {AuthService} from "../../../services/auth.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import firebase from 'firebase/compat/app';
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-edit-location-dialog',
  templateUrl: './edit-location-dialog.component.html',
  styleUrls: ['./edit-location-dialog.component.scss']
})
export class EditLocationDialogComponent implements OnInit, OnDestroy {

  clientId: string;
  locationId: string;
  locationName: string;
  location: any;
  editLocationForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;

  constructor(
      private firestoreService: FirestoreService,
      public authService: AuthService,
      private snackBar: MatSnackBar,
      private fb: UntypedFormBuilder,
      private dialogRef: MatDialogRef<EditLocationDialogComponent>,
  @Inject(MAT_DIALOG_DATA) data) {

    this.clientId = data.clientId;
    this.location = data.location;

    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(userDocData => {
      this.loggedInUserDocData = userDocData;
    });
  }
  openInGoogleMap(latitude: number, longitude: number) {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  }
  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.editLocationForm = this.fb.group({
      name: [this.location.name, [Validators.required]],
      entrancePointLatitude: [this.location.entrancePoint?._lat, []],
      entrancePointLongitude: [this.location.entrancePoint?._long, []],
      trolleysStart: [this.location.trolleys?.start, []],
      trolleysEnd: [this.location.trolleys?.end, []],
    });
  }

  async updateLocation() {
    if (!this.editLocationForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editLocationForm?.value?.name && (this.editLocationForm?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const updateLocationFormValue = this.editLocationForm.value;
    const locationToUpdate: any = {};
    locationToUpdate.name = updateLocationFormValue.name?.trim();

    if ((updateLocationFormValue.entrancePointLatitude && !updateLocationFormValue.entrancePointLongitude)
        || (!updateLocationFormValue.entrancePointLatitude && updateLocationFormValue.entrancePointLongitude)) {
      this.openSnackBar('Either both Latitude & Longitude should be entered or none!', 'error');
      return;
    }

    if (updateLocationFormValue.entrancePointLatitude) {
      try {
        locationToUpdate.entrancePoint = new firebase.firestore.GeoPoint(updateLocationFormValue.entrancePointLatitude, updateLocationFormValue.entrancePointLongitude);
      } catch (error) {
        this.openSnackBar(error.message, 'error');
        return;
      }
    } else {
      locationToUpdate.entrancePoint = null;
    }

    if (updateLocationFormValue.trolleysStart || updateLocationFormValue.trolleysEnd) {
      locationToUpdate.trolleys = {};
      locationToUpdate.trolleys.start = updateLocationFormValue.trolleysStart;
      locationToUpdate.trolleys.end = updateLocationFormValue.trolleysEnd;
    } else {
      locationToUpdate.trolleys = null;
    }

    try {
      await this.firestoreService.updateLocByIdForClientId(this.clientId, this.location.id, locationToUpdate);
      this.openSnackBar('Location updated successfully', 'success');
      this.editLocationForm.markAsPristine();
      this.dialogRef.close();
    } catch (error) {
      this.openSnackBar('Error in updating location:' + error.message, 'error');
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
