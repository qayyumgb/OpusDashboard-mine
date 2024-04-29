import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {AuthService} from '../../../services/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClientInContextService} from "../../../services/client-in-context.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-create-worker-dialog',
  templateUrl: './create-worker-dialog.component.html',
  styleUrls: ['./create-worker-dialog.component.scss']
})
export class CreateWorkerDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  description: string;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  allLocationsList: any[];
  locationListSubscription: Subscription;
  allwgGroupsList: any[];
  wgListSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateWorkerDialogComponent>,
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

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => (this.allLocationsList = locationsList.sort((locA: any, locB: any) => {
          return locA.name?.toLowerCase() < locB.name?.toLowerCase() ? -1 : locA.name?.toLowerCase() > locB.name?.toLowerCase() ? 1 : 0;
        })));

      this.wgListSubscription = this.firestoreService
        .getAllUnarchivedWorkerGroupsForClientId(this.selectedClientDocData?.id)
        .subscribe((wgList) => (this.allwgGroupsList = wgList.sort((wgA: any, wgB: any) => {
          return wgA.name?.toLowerCase() < wgB.name?.toLowerCase() ? -1 : wgA.name?.toLowerCase() > wgB.name?.toLowerCase() ? 1 : 0;
        })));
    });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
    this.wgListSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      workerCode: [Math.floor(Math.random() * 90 + 10) + '', []],
      workerGroupId: ['', []],
      isLeftHanded: [false, []],
      locationIds: ['', []],
      hourlyRate: [0.00, []],
      notes: ['', []],
    });

    this.form.controls.hourlyRate.valueChanges.subscribe(val => {
      if (!val) {
        return;
      }
      const valString = '' + val;
      if (valString?.indexOf('.') === -1) {
        return;
      }

      if (valString?.indexOf('.') !== -1) {
        if (valString?.endsWith('.')) {
          return;
        }
      }
      const valNumber = +valString;
      let decimalCount = 0;
      if ((valNumber % 1) !== 0) {
        decimalCount = valNumber.toString().split(".")[1].length;
      }

      const newVal = +valNumber.toFixed(decimalCount <= 2 ? decimalCount : 2);
      if (newVal !== +this.form.controls.hourlyRate.value) {
        this.form.patchValue({hourlyRate: newVal});
      }
    });
  }

  async createWorker() {

    if ((this.form?.value?.workerCode !== '') && (!/^([0-9]{2})$/.test(this.form?.value?.workerCode))) {
      this.openSnackBar('Please enter exactly 2 digits for worker code!', 'error');
      return;
    }

    if (!this.form.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.form?.value?.name && (this.form?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const workerToCreate = this.form.value;
    workerToCreate.name = workerToCreate.name?.trim();
    workerToCreate.isArchived = false;

    if (workerToCreate.workerGroupId) {
      workerToCreate.workerGroupName = this.allwgGroupsList.filter(wg => wg.id === workerToCreate.workerGroupId)[0]?.name;
    } else {
      workerToCreate.workerGroupId = null;
      workerToCreate.workerGroupName = null;
    }

    try {
      await this.firestoreService.createWorkerForClientId(workerToCreate, this.selectedClientDocData.id);
      this.openSnackBar('Worker created successfully', 'success');
      this.form.reset({
        workerCode: Math.floor(Math.random() * 90 + 10) + ''
      });
    } catch (error) {
      this.openSnackBar('Error in worker creation:' + error.message, 'error');
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
