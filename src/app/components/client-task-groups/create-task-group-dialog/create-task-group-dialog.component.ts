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
  selector: 'app-create-task-group-dialog',
  templateUrl: './create-task-group-dialog.component.html',
  styleUrls: ['./create-task-group-dialog.component.scss']
})
export class CreateTaskGroupDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;

  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateTaskGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

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
      name: ['', [Validators.required]]
    });
  }

  async createTaskGroup() {
    if (!this.form.valid) {
      this.openSnackBar('Name is mandatory', 'error');
      return;
    }

    if (this.form?.value?.name && (this.form?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const taskGroupToCreate = this.form.value;
    taskGroupToCreate.name = taskGroupToCreate.name?.trim();

    try {
      await this.firestoreService.createTaskGroupForClientId(taskGroupToCreate, this.selectedClientDocData.id);
      this.dialogRef.close(this.form.value);
      this.openSnackBar(`Task Group '${taskGroupToCreate.name}' created successfully.`, 'success');
      this.form.reset();
    } catch (error) {
      this.openSnackBar('Error in task group creation:' + error.message, 'error');
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

