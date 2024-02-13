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
  selector: 'app-create-variety-dialog',
  templateUrl: './create-variety-dialog.component.html',
  styleUrls: ['./create-variety-dialog.component.scss']
})
export class CreateVarietyDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  description: string;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateVarietyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.description = data.description;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
    });
  }

  async createVariety() {
    if (!this.form.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.form?.value?.name && (this.form?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }


    const varietyToCreate = this.form.value;
    varietyToCreate.name = varietyToCreate.name?.trim();
    try {
      await this.firestoreService.createVarietyForClientId(varietyToCreate, this.selectedClientDocData.id);
      this.dialogRef.close(this.form.value);
      this.openSnackBar(`Variety '${varietyToCreate.name}' created successfully.`, 'success');
      this.form.reset();
    } catch (error) {
      this.openSnackBar('Error in variety creation:' + error.message, 'error');
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


