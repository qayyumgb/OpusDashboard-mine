import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../../services/firestore.service';
import {AuthService} from '../../../../services/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import firebase from 'firebase/compat/app';
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../../../common/utils/utils";

@Component({
  selector: 'app-edit-layout-dialog',
  templateUrl: './edit-layout-dialog.component.html',
  styleUrls: ['./edit-layout-dialog.component.scss']
})
export class EditLayoutDialogComponent implements OnInit, OnDestroy {

  clientId: string;
  locationId: string;
  locationName: string;
  layout: any;
  editLayoutForm: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;

  constructor(
    private firestoreService: FirestoreService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<EditLayoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.clientId = data.clientId;
    this.locationId = data.locationId;
    this.locationName = data.locationName;
    this.layout = data.layout;

    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(userDocData => {
      this.loggedInUserDocData = userDocData;
    });
  }

  ngOnDestroy(): void {
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.editLayoutForm = this.fb.group({
      name: [this.layout.name, [Validators.required]],
      firstRowNumber: [this.layout.firstRowNumber, []],
      firstRowLatitude: [this.layout.firstPoint?._lat, []],
      firstRowLongitude: [this.layout.firstPoint?._long, []],
      secondRowNumber: [this.layout.secondRowNumber, []],
      secondRowLatitude: [this.layout.secondPoint?._lat, []],
      secondRowLongitude: [this.layout.secondPoint?._long, []],
    });
  }
  openInGoogleMap(latitude: number, longitude: number) {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  }
  async updateLayout() {
    if (!this.editLayoutForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editLayoutForm?.value?.name && (this.editLayoutForm?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const layoutToUpdate = this.editLayoutForm.value;

    if ((layoutToUpdate.firstRowLatitude && !layoutToUpdate.firstRowLongitude) || (!layoutToUpdate.firstRowLatitude && layoutToUpdate.firstRowLongitude)) {
      this.openSnackBar('Either both Latitude & Longitude should be entered or none!', 'error');
      return;
    }

    if ((layoutToUpdate.secondRowLatitude && !layoutToUpdate.secondRowLongitude) || (!layoutToUpdate.secondRowLatitude && layoutToUpdate.secondRowLongitude)) {
      this.openSnackBar('Either both Latitude & Longitude should be entered or none!', 'error');
      return;
    }

    if (layoutToUpdate.firstRowLatitude) {
      try {
        layoutToUpdate.firstPoint = new firebase.firestore.GeoPoint(layoutToUpdate.firstRowLatitude, layoutToUpdate.firstRowLongitude);
      } catch (error) {
        this.openSnackBar(error.message, 'error');
        return;
      }
    } else {
      layoutToUpdate.firstPoint = null;
    }

    if (layoutToUpdate.secondRowLatitude) {
      try {
        layoutToUpdate.secondPoint = new firebase.firestore.GeoPoint(layoutToUpdate.secondRowLatitude, layoutToUpdate.secondRowLongitude);
      } catch (error) {
        this.openSnackBar(error.message, 'error');
        return;
      }
    } else {
      layoutToUpdate.secondPoint = null;
    }

    layoutToUpdate.name = layoutToUpdate.name?.trim();

    delete layoutToUpdate.firstRowLatitude;
    delete layoutToUpdate.firstRowLongitude;
    delete layoutToUpdate.secondRowLatitude;
    delete layoutToUpdate.secondRowLongitude;

    try {
      await this.firestoreService.updateLytByIdForLocationIdClientId(this.clientId, this.locationId, this.layout.id, layoutToUpdate);
			this.openSnackBar('Layout updated successfully', 'success');
      this.editLayoutForm.markAsPristine();
			this.dialogRef.close();
    } catch (error) {
			this.openSnackBar('Error in updating layout:' + error.message, 'error');
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
