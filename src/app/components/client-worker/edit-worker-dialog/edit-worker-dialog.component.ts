import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FirestoreService} from '../../../services/firestore.service';
import {AuthService} from '../../../services/auth.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ClientInContextService} from "../../../services/client-in-context.service";

@Component({
  selector: 'app-create-worker-dialog',
  templateUrl: './edit-worker-dialog.component.html',
  styleUrls: ['./edit-worker-dialog.component.scss']
})
export class EditWorkerDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  dataFromParent: any;
  allLocationsList: any[];
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  locationListSubscription: Subscription;
  allwgGroupsList = [];
  wgListSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditWorkerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.dataFromParent = data;
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

  ngOnInit() {
    this.form = this.fb.group({
      name: [this.dataFromParent.name, [Validators.required]],
      workerCode: [this.dataFromParent.workerCode, []],
      workerGroupId: [this.dataFromParent.workerGroupId, []],
      isLeftHanded: [this.dataFromParent.isLeftHanded, []],
      locationIds: [this.dataFromParent.locationIds, []],
      hourlyRate: [+this.dataFromParent.hourlyRate, []],
      notes: [this.dataFromParent.notes, []],
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

  async updateWorker() {
    if (this.dataFromParent.workerCode && (!/^([0-9]{2})$/.test(this.form?.value?.workerCode))) {
      this.openSnackBar('Please enter exactly 2 digits for worker code!', 'error');
      return;
    }

    if (this.form.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.form?.value?.name && (this.form?.value?.name?.trim() === '')) {
      this.openSnackBar('Empty or Invalid value entered for Name', 'error');
      return;
    }

    const workerDataToUpdate = this.form.value;
    workerDataToUpdate.name = workerDataToUpdate.name?.trim();

    if (workerDataToUpdate.workerGroupId) {
      workerDataToUpdate.workerGroupName = this.allwgGroupsList.filter(wg => wg.id === workerDataToUpdate.workerGroupId)[0]?.name;
    } else {
      workerDataToUpdate.workerGroupId = null;
      workerDataToUpdate.workerGroupName = null;
    }

    try {
      workerDataToUpdate.id = this.dataFromParent.id;
      await this.firestoreService.updateWorkerForClientId(workerDataToUpdate, this.selectedClientDocData.id);
      this.openSnackBar('Changes have been saved', 'success');
      this.form.markAsPristine();
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
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
    this.wgListSubscription?.unsubscribe();
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
