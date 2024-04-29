import {ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {pairwise, startWith, Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-edit-task-dialog',
  templateUrl: './edit-task-dialog.component.html',
  styleUrls: ['./edit-task-dialog.component.scss']
})
export class EditTaskDialogComponent implements OnInit, OnDestroy {
  editTaskForm: UntypedFormGroup;

  taskRecordBeingEdited: any;
  selectedClientDocData: any;
  clientInContextServiceSubscription: Subscription;
  allTaskGroupsList: any[];
  taskGroupsSubscription: Subscription;
  allFunctionsList: any[] = [];
  allClockFunctionsList = [
    {
      id: 'START_DAY',
      name: 'Start working day'
    },
    {
      id: 'END_DAY',
      name: 'End working day'
    },
    {
      id: 'START_BREAK_PAID',
      name: 'Start break paid'
    },
    {
      id: 'END_BREAK_PAID',
      name: 'End break paid'
    },
    {
      id: 'START_BREAK_UNPAID',
      name: 'Start break unpaid'
    },
    {
      id: 'END_BREAK_UNPAID',
      name: 'End break unpaid'
    },
    {
      id: 'START_BREAK',
      name: 'Start break'
    },
    {
      id: 'END_BREAK',
      name: 'End break'
    },
    {
      id: 'START_TASK',
      name: 'Start task'
    },
    {
      id: 'END_TASK',
      name: 'End task'
    }
  ];

  allWatchWebappFunctionsList = [
    {
      id: 'TASK',
      name: 'Task'
    },
    {
      id: 'BREAK_PAID',
      name: 'Break paid'
    },
    {
      id: 'BREAK_UNPAID',
      name: 'Break unpaid'
    },
    {
      id: 'ROW_TASK',
      name: 'Row task'
    }
  ];

  allTargetDevicesList = [
    {
      id: 'WATCH',
      name: 'Watch'
    },
    {
      id: 'CLOCKWEB',
      name: 'ClockWeb'
    },
    {
      id: 'CLOCK',
      name: 'Clock'
    }

  ];
  private loggedInUserFromAuthServiceSubscription: Subscription;
  private loggedInUserDocData: any;
  allLocationsList: any[];
  locationListSubscription: Subscription;


  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EditTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data,
    private ref: ChangeDetectorRef
  ) {
    this.taskRecordBeingEdited = data.taskRecord;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => {
          this.allLocationsList = locationsList.sort((locA: any, locB: any) => {
            return locA.name?.toLowerCase() < locB.name?.toLowerCase() ? -1 : locA.name?.toLowerCase() > locB.name?.toLowerCase() ? 1 : 0;
          });
        });

      this.taskGroupsSubscription = this.firestoreService
        .getAllUnarchivedTaskGroupsForClientId(this.selectedClientDocData.id).subscribe(taskGroupsList => (this.allTaskGroupsList = taskGroupsList));
    });

    this.loggedInUserFromAuthServiceSubscription = this.authService.loggedInUserFromAuthService$.subscribe(
      (userDocData) => {
        this.loggedInUserDocData = userDocData;
      });
  }

  ngOnInit() {
    if (this.taskRecordBeingEdited.type === 'PIT') {
      this.allFunctionsList = this.allClockFunctionsList;
    } else if (this.taskRecordBeingEdited.type === 'TASK' || this.taskRecordBeingEdited.type === 'BREAK') {
      this.allFunctionsList = this.allWatchWebappFunctionsList;
    }
    this.editTaskForm = this.fb.group({
      name: [this.taskRecordBeingEdited.name, [Validators.required]],
      deviceTarget: [{value: this.taskRecordBeingEdited.deviceTarget, disabled: false}, []],
      func: [{value: this.taskRecordBeingEdited.func, disabled: this.allFunctionsList.length === 0}, []],
      taskGroupIds: [this.taskRecordBeingEdited.taskGroupIds, []],
      locationIds: [this.taskRecordBeingEdited.locationIds, [Validators.required]]
    });

    this.editTaskForm.controls.deviceTarget?.valueChanges
      .pipe(startWith(this.editTaskForm.controls.value), pairwise())
      .subscribe(([prev, next]: [any, any]) => {
        //console.log('prev:' + JSON.stringify(prev));
        //console.log('next:' + JSON.stringify(next));
        //console.log('------------------------------------------');
        if (prev?.includes('CLOCK') && next?.includes('CLOCK') && (next?.includes('WATCH') || next?.includes('CLOCKWEB'))) {
          const toSet = [];
          if (next?.includes('WATCH')) {
            toSet.push('WATCH');
          }
          if (next?.includes('CLOCKWEB')) {
            toSet.push('CLOCKWEB');
          }
          this.allFunctionsList = this.allWatchWebappFunctionsList;
          this.editTaskForm.controls.func.enable();
          this.editTaskForm.patchValue({
            deviceTarget: toSet,
            func: null
          });
        } else if ((prev?.includes('WATCH') || prev?.includes('CLOCKWEB')) && (next?.includes('CLOCK'))) {
          const toSet = ['CLOCK'];
          this.allFunctionsList = this.allClockFunctionsList;
          this.editTaskForm.controls.func.enable();
          this.editTaskForm.patchValue({
            deviceTarget: toSet,
            func: null
          });
        } else if (!prev && next.includes('CLOCK') && (this.taskRecordBeingEdited.type === 'CLOCK') && (next.includes('WATCH') || next.includes('CLOCKWEB'))) {
          const toSet = [];
          if (next?.includes('WATCH')) {
            toSet.push('WATCH');
          }
          if (next?.includes('CLOCKWEB')) {
            toSet.push('CLOCKWEB');
          }
          this.allFunctionsList = this.allWatchWebappFunctionsList;
          this.editTaskForm.controls.func.enable();
          this.editTaskForm.patchValue({
            deviceTarget: toSet,
            func: null
          });
        } else if (!prev && next.includes('CLOCK') && (['BREAK', 'TASK'].includes(this.taskRecordBeingEdited.type)) && (next.includes('WATCH') || next.includes('CLOCKWEB'))) {
          const toSet = ['CLOCK'];
          this.allFunctionsList = this.allClockFunctionsList;
          this.editTaskForm.controls.func.enable();
          this.editTaskForm.patchValue({
            deviceTarget: toSet,
            func: null
          });
        } else if (next?.includes('WATCH') || next?.includes('CLOCKWEB')) {
          this.allFunctionsList = this.allWatchWebappFunctionsList
          this.editTaskForm.controls.func.enable();
        } else if (next?.includes('CLOCK')) {
          this.allFunctionsList = this.allClockFunctionsList;
          this.editTaskForm.controls.func.enable();
        } else {
          this.editTaskForm.patchValue({
            func: null
          });
          this.editTaskForm.controls.func.disable();
        }
      });
  }

  async updateTask() {
    if (!this.editTaskForm.valid) {
      this.openSnackBar('Please enter all mandatory values', 'error');
      return;
    }

    if (this.editTaskForm.pristine) {
      this.openSnackBar('No changes detected!', 'error');
      return;
    }

    if (this.editTaskForm?.value?.name && this.editTaskForm?.value?.name?.trim() === '') {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const taskDataToUpdate = this.editTaskForm.value;
    taskDataToUpdate.name = taskDataToUpdate.name?.trim();

    const taskGroups = [];
    if (taskDataToUpdate.taskGroupIds && taskDataToUpdate.taskGroupIds.length > 0) {
      for (const taskGroupId of taskDataToUpdate.taskGroupIds) {
        taskGroups.push(this.allTaskGroupsList
          .filter((taskGroup) => taskGroup.id === taskGroupId)
          .map((taskGroup) => (taskGroup.name ? taskGroup.name : null))[0]);
      }
    }

    taskDataToUpdate.taskGroups = taskGroups;

    if (this.allClockFunctionsList.map(func => func.id).includes(taskDataToUpdate.func)) {
      taskDataToUpdate.type = 'PIT';
    }

    if (this.allWatchWebappFunctionsList.map(func => func.id).includes(taskDataToUpdate.func)) {
      if (taskDataToUpdate.func === 'TASK' || taskDataToUpdate.func === 'ROW_TASK') {
        taskDataToUpdate.type = 'TASK';
      } else if (['BREAK_PAID', 'BREAK_UNPAID'].includes(taskDataToUpdate.func)) {
        taskDataToUpdate.type = 'BREAK'
      }
    }

    taskDataToUpdate.updatedByUserId = this.loggedInUserDocData.id ?? null;
    taskDataToUpdate.updatedByUserName = this.loggedInUserDocData.name ?? null;

    try {
      await this.firestoreService
        .updateTaskByIdForClientId(this.taskRecordBeingEdited.id, this.selectedClientDocData.id, taskDataToUpdate);
      this.openSnackBar('Changes have been saved', 'success');
      this.editTaskForm.markAsPristine();
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
    this.taskGroupsSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
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

