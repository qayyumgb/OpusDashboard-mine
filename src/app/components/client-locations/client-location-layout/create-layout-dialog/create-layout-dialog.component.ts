import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../../services/firestore.service';
import {AuthService} from '../../../../services/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import firebase from 'firebase/compat/app';
import {ClientInContextService} from "../../../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../../../common/utils/utils";


@Component({
  selector: 'app-create-layout-dialog',
  templateUrl: './create-layout-dialog.component.html',
  styleUrls: ['./create-layout-dialog.component.scss']
})
export class CreateLayoutDialogComponent implements OnInit, OnDestroy {

  createLayoutForm: UntypedFormGroup;
  description: string;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientId: string;
  locationId: string;
  locationName: string;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(
    private firestoreService: FirestoreService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private clientInContextService: ClientInContextService,
    private dialogRef: MatDialogRef<CreateLayoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });

    this.clientId = data.clientId;
    this.locationId = data.locationId;
    this.locationName = data.locationName;

    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(userDocData => {
      this.loggedInUserDocData = userDocData;
    });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.createLayoutForm = this.fb.group({
      name: ['', [Validators.required]],
      firstRowNumber: ['', []],
      firstRowLatitude: ['', []],
      firstRowLongitude: ['', []],
      secondRowNumber: ['', []],
      secondRowLatitude: ['', []],
      secondRowLongitude: ['', []],
    });
  }

  async createLayout() {
    if (!this.createLayoutForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }


    if (this.createLayoutForm?.value?.name && (this.createLayoutForm?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const layoutToCreate = this.createLayoutForm.value;

    if ((layoutToCreate.firstRowLatitude && !layoutToCreate.firstRowLongitude) || (!layoutToCreate.firstRowLatitude && layoutToCreate.firstRowLongitude)) {
      this.openSnackBar('Either both Latitude & Longitude should be entered or none!', 'error');
      return;
    }

    if ((layoutToCreate.secondRowLatitude && !layoutToCreate.secondRowLongitude) || (!layoutToCreate.secondRowLatitude && layoutToCreate.secondRowLongitude)) {
      this.openSnackBar('Either both Latitude & Longitude should be entered or none!', 'error');
      return;
    }

    if (layoutToCreate.firstRowLatitude) {
      try {
        layoutToCreate.firstPoint = new firebase.firestore.GeoPoint(layoutToCreate.firstRowLatitude, layoutToCreate.firstRowLongitude);
      } catch (error) {
        this.openSnackBar(error.message, 'error');
        return;
      }
    } else {
      layoutToCreate.firstPoint = null;
    }


    if (layoutToCreate.secondRowLatitude) {
      try {
        layoutToCreate.secondPoint = new firebase.firestore.GeoPoint(layoutToCreate.secondRowLatitude, layoutToCreate.secondRowLongitude);
      } catch (error) {
        this.openSnackBar(error.message, 'error');
        return;
      }
    } else {
      layoutToCreate.secondPoint = null;
    }

    layoutToCreate.name = layoutToCreate.name?.trim();

    delete layoutToCreate.firstRowLatitude;
    delete layoutToCreate.firstRowLongitude;
    delete layoutToCreate.secondRowLatitude;
    delete layoutToCreate.secondRowLongitude;

    try {
      await this.firestoreService.createLayoutForLocationIdClientId(this.clientId, this.locationId, layoutToCreate);
      this.openSnackBar('Layout created successfully', 'success');
      this.createLayoutForm.reset();
      this.dialogRef.close();
    } catch (error) {
      this.openSnackBar('Error in layout creation:' + error.message, 'error');
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
