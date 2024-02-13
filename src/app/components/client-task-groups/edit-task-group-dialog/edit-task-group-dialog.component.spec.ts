import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTaskGroupDialogComponent } from './edit-task-group-dialog.component';

describe('EditTaskGroupDialogComponent', () => {
  let component: EditTaskGroupDialogComponent;
  let fixture: ComponentFixture<EditTaskGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditTaskGroupDialogComponent]
    });
    fixture = TestBed.createComponent(EditTaskGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
