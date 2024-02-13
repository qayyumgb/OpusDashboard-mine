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
  selector: 'app-edit-task-group-dialog',
  templateUrl: './edit-task-group-dialog.component.html',
  styleUrls: ['./edit-task-group-dialog.component.scss']
})
export class EditTaskGroupDialogComponent implements OnInit, OnDestroy {
  editTaskGroupForm: UntypedFormGroup;

  taskGroupRecordBeingEdited: any;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditTaskGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.taskGroupRecordBeingEdited = data.taskGroupRecord;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;
    });
  }

  ngOnInit() {
    this.editTaskGroupForm = this.fb.group({
      name: [this.taskGroupRecordBeingEdited.name, [Validators.required]]
    });
  }

  async updateTaskGroup() {
    if (!this.editTaskGroupForm.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.editTaskGroupForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editTaskGroupForm?.value?.name && this.editTaskGroupForm?.value?.name?.trim() === '') {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const taskGroupDataToUpdate = this.editTaskGroupForm.value;
    taskGroupDataToUpdate.name = taskGroupDataToUpdate.name?.trim();

    try {
      await this.firestoreService
        .updateTaskGroupByIdForClientId(this.taskGroupRecordBeingEdited.id, this.selectedClientDocData.id, taskGroupDataToUpdate);
      this.openSnackBar('Changes have been saved', 'success');
      this.editTaskGroupForm.markAsPristine();
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

