import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {AuthService} from '../../../services/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClientInContextService} from "../../../services/client-in-context.service";
import firebase from 'firebase/compat/app';
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
    selector: 'app-create-location-dialog',
    templateUrl: './create-location-dialog.component.html',
    styleUrls: ['./create-location-dialog.component.scss']
})
export class CreateLocationDialogComponent implements OnInit, OnDestroy {

    createLocationForm: UntypedFormGroup;
    description: string;
    loggedInUserFromAuthServiceSubscription: Subscription;
    loggedInUserDocData: any;
    clientInContextServiceSubscription: Subscription;
    selectedClientDocData: any;

    constructor(
        private firestoreService: FirestoreService,
        private clientInContextService: ClientInContextService,
        public authService: AuthService,
        private snackBar: MatSnackBar,
        private fb: UntypedFormBuilder,
        private dialogRef: MatDialogRef<CreateLocationDialogComponent>,
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

    ngOnInit() {
        this.createLocationForm = this.fb.group({
            name: ['', [Validators.required]],
            entrancePointLatitude: ['', []],
            entrancePointLongitude: ['', []],
            trolleysStart: ['', []],
            trolleysEnd: ['', []],
        });
    }

    async createLocation() {
        if (!this.createLocationForm.valid) {
            this.openSnackBar('Name is mandatory', 'error');
            return;
        }

        if (this.createLocationForm?.value?.name && (this.createLocationForm?.value?.name?.trim() === '')) {
            this.openSnackBar('Invalid value entered for Name', 'error');
            return;
        }

        const locationFormValue = this.createLocationForm.value;
        const locationToCreate: any = {};
        locationToCreate.name = locationFormValue.name?.trim();


        if ((locationFormValue.entrancePointLatitude && !locationFormValue.entrancePointLongitude)
            || (!locationFormValue.entrancePointLatitude && locationFormValue.entrancePointLongitude)) {
            this.openSnackBar('Either both Latitude & Longitude should be entered or none!', 'error');
            return;
        }

        if (locationFormValue.entrancePointLatitude) {
            try {
                locationToCreate.entrancePoint = new firebase.firestore.GeoPoint(locationFormValue.entrancePointLatitude, locationFormValue.entrancePointLongitude);
            } catch (error) {
                this.openSnackBar(error.message, 'error');
                return;
            }
        } else {
            locationToCreate.entrancePoint = null;
        }

        if (locationFormValue.trolleysStart || locationFormValue.trolleysEnd) {
            locationToCreate.trolleys = {};
            locationToCreate.trolleys.start = locationFormValue.trolleysStart;
            locationToCreate.trolleys.end = locationFormValue.trolleysEnd;
        } else {
            locationToCreate.trolleys = null;
        }

        try {
            await this.firestoreService.createLocationClientId(this.selectedClientDocData?.id, locationToCreate);
            this.openSnackBar('Location created successfully', 'success');
            this.createLocationForm.reset();
            this.dialogRef.close();
        } catch (error) {
            this.openSnackBar('Error in location creation:' + error.message, 'error');
            console.log(error.message);
        }
    }

    close() {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
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
