import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FirestoreService } from '../../../services/firestore.service';
import { AuthService } from '../../../services/auth.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ClientInContextService} from "../../../services/client-in-context.service";

@Component({
  selector: 'app-edit-training-dialog',
  templateUrl: './edit-training-dialog.component.html',
  styleUrls: ['./edit-training-dialog.component.scss'],
})
export class EditTrainingDialogComponent implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  loggedInUserFromAuthServiceSubscription: Subscription;
  loggedInUserDocData: any;
  successMessage: any;
  failureMessage: any;
  private trainingRecordBeingEdited: any;
  allModelsList: any[];
  private modelListSubscription: Subscription;
  private trainingListSubscription: Subscription;
  allTrainingsList: any[];
  urlReg: RegExp = new RegExp(
    '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?'
  );
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<EditTrainingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.trainingRecordBeingEdited = data.trainingRecord;
    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
        this.trainingListSubscription = this.firestoreService
          .getAllTrainingsForClientId(this.selectedClientDocData?.id)
          .subscribe((trainingList) => (this.allTrainingsList = trainingList));
        this.modelListSubscription = this.firestoreService
          .getAllModels()
          .subscribe((modelList) => (this.allModelsList = modelList));
      }
    );

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnInit() {
    this.form = this.fb.group({
      notes: [this.trainingRecordBeingEdited.notes, []],
      youtubeLink: [
        this.trainingRecordBeingEdited.youtubeLink,
        [Validators.pattern(this.urlReg)],
      ],
    });
  }

  async updateDevice() {
    this.successMessage = null;
    this.failureMessage = null;

    if (this.form.pristine) {
      this.failureMessage = 'No changes detected!';
      return;
    }

    const trainingDataToUpdate = this.form.value;
    trainingDataToUpdate.notes = trainingDataToUpdate.notes?.trim();
    trainingDataToUpdate.youtubeLink = trainingDataToUpdate.youtubeLink?.trim();

    console.log(trainingDataToUpdate.youtubeLink);

    if (
      !this.urlReg.test(trainingDataToUpdate.youtubeLink) &&
      trainingDataToUpdate.youtubeLink !== ''
    ) {
      this.failureMessage = 'Url not valid';
      return;
    }

    try {
      trainingDataToUpdate.id = this.trainingRecordBeingEdited.id;

      await this.firestoreService.updateTraining(trainingDataToUpdate);
      this.successMessage = 'Changes have been saved';
      this.form.markAsPristine();
    } catch (error) {
      this.failureMessage = 'Error in saving changes:' + error.message;
      console.log(error.message);
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.modelListSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.trainingListSubscription?.unsubscribe();
    this.clientInContextServiceSubscription?.unsubscribe();
  }
}
