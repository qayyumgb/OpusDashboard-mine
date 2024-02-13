import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWorkerGroupDialogComponent } from './edit-worker-group-dialog.component';

describe('EditWorkerGroupDialogComponent', () => {
  let component: EditWorkerGroupDialogComponent;
  let fixture: ComponentFixture<EditWorkerGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditWorkerGroupDialogComponent]
    });
    fixture = TestBed.createComponent(EditWorkerGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
