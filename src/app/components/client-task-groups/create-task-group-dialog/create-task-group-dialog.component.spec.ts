import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTaskGroupDialogComponent } from './create-task-group-dialog.component';

describe('CreateTaskGroupDialogComponent', () => {
  let component: CreateTaskGroupDialogComponent;
  let fixture: ComponentFixture<CreateTaskGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateTaskGroupDialogComponent]
    });
    fixture = TestBed.createComponent(CreateTaskGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
