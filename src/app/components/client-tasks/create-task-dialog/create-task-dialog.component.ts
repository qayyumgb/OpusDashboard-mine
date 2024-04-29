import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms";
import {pairwise, startWith, Subscription} from "rxjs";
import {FirestoreService} from "../../../services/firestore.service";
import {ClientInContextService} from "../../../services/client-in-context.service";
import {AuthService} from "../../../services/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SNACKBAR_CLASSES} from "../../../common/utils/utils";

@Component({
  selector: 'app-create-task-dialog',
  templateUrl: './create-task-dialog.component.html',
  styleUrls: ['./create-task-dialog.component.scss']
})
export class CreateTaskDialogComponent implements OnInit, OnDestroy {

  form: UntypedFormGroup;
  description: string;
  clientInContextServiceSubscription: Subscription;
  selectedClientDocData: any;
  taskGroupsSubscription: Subscription;
  allTaskGroupsList: any[];
  allFunctionsList: any[];
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
  locationListSubscription: Subscription;
  allLocationsList: any[];


  constructor(
    private firestoreService: FirestoreService,
    private clientInContextService: ClientInContextService,
    public authService: AuthService,
    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.description = data.description;

    this.clientInContextServiceSubscription = this.clientInContextService.clientInContextSubject.subscribe(selectedClientDocData => {
      if (!selectedClientDocData) {
        return;
      }
      this.selectedClientDocData = selectedClientDocData;

      this.locationListSubscription = this.firestoreService
        .getAllLocationsForClientId(this.selectedClientDocData?.id)
        .subscribe((locationsList) => {
          this.form.patchValue({locationIds: locationsList.map(loc => loc.id)});
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
      }
    );
  }

  ngOnDestroy(): void {
    this.clientInContextServiceSubscription?.unsubscribe();
    this.taskGroupsSubscription?.unsubscribe();
    this.loggedInUserFromAuthServiceSubscription?.unsubscribe();
    this.locationListSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      deviceTarget: [[], []],
      taskGroupIds: [[], []],
      locationIds: [[], [Validators.required]],
      func: [{value: null, disabled: true}, []]
    });

    this.form.controls.deviceTarget?.valueChanges
      .pipe(startWith(this.form.controls.value), pairwise())
      .subscribe(([prev, next]: [any, any]) => {
        //console.log('prev:' + JSON.stringify(prev));
        //console.log('next:' + JSON.stringify(next));
        //console.log('------------------------------------------')
        if (prev?.includes('CLOCK') && next?.includes('CLOCK') && (next?.includes('WATCH') || next?.includes('CLOCKWEB'))) {
          const toSet = [];
          if (next?.includes('WATCH')) {
            toSet.push('WATCH');
          }
          if (next?.includes('CLOCKWEB')) {
            toSet.push('CLOCKWEB');
          }
          this.allFunctionsList = this.allWatchWebappFunctionsList;
          this.form.controls.func.enable();
          this.form.patchValue({
            deviceTarget: toSet,
            func: null
          });
        } else if ((prev?.includes('WATCH') || prev?.includes('CLOCKWEB')) && (next?.includes('CLOCK'))) {
          const toSet = ['CLOCK'];
          this.allFunctionsList = this.allClockFunctionsList;
          this.form.controls.func.enable();
          this.form.patchValue({
            deviceTarget: toSet,
            func: null
          });
        } else if (next?.includes('WATCH') || next?.includes('CLOCKWEB')) {
          this.allFunctionsList = this.allWatchWebappFunctionsList
          this.form.controls.func.enable();
        } else if (next?.includes('CLOCK')) {
          this.allFunctionsList = this.allClockFunctionsList;
          this.form.controls.func.enable();
        } else {
          this.form.patchValue({
            func: null
          });
          this.form.controls.func.disable();
        }
      });
  }

  async createTask() {
    if (!this.form.valid) {
      this.openSnackBar('Please enter all mandatory values', 'error');
      return;
    }

    if (this.form?.value?.name && (this.form?.value?.name?.trim() === '')) {
      this.openSnackBar('Invalid value entered for Name', 'error');
      return;
    }

    const taskToCreate = this.form.value;
    taskToCreate.name = taskToCreate.name?.trim();

    const taskGroups = [];
    if (taskToCreate.taskGroupIds && taskToCreate.taskGroupIds.length > 0) {
      for (const taskGroupId of taskToCreate.taskGroupIds) {
        taskGroups.push(this.allTaskGroupsList
          .filter((taskGroup) => taskGroup.id === taskGroupId)
          .map((taskGroup) => (taskGroup.name ? taskGroup.name : null))[0]);
      }
    }

    taskToCreate.taskGroups = taskGroups;

    if (this.allClockFunctionsList.map(func => func.id).includes(taskToCreate.func)) {
      taskToCreate.type = 'PIT';
    }

    if (this.allWatchWebappFunctionsList.map(func => func.id).includes(taskToCreate.func)) {
      if (taskToCreate.func === 'TASK' || taskToCreate.func === 'ROW_TASK' ) {
        taskToCreate.type = 'TASK';
      } else if (['BREAK_PAID', 'BREAK_UNPAID'].includes(taskToCreate.func)) {
        taskToCreate.type = 'BREAK'
      }
    }

    taskToCreate.createdByUserId = this.loggedInUserDocData.id ?? null;
    taskToCreate.createdByUserName = this.loggedInUserDocData.name ?? null;

    try {
      await this.firestoreService.createTaskForClientId(taskToCreate, this.selectedClientDocData.id);
      this.dialogRef.close(this.form.value);
      this.openSnackBar(`Task '${taskToCreate.name}' created successfully.`, 'success');
      this.form.reset();
    } catch (error) {
      this.openSnackBar('Error in task creation:' + error.message, 'error');
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


