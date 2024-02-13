import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditWorkerDialogComponent } from './edit-worker-dialog.component';

describe('CreateWorkerDialogComponent', () => {
  let component: EditWorkerDialogComponent;
  let fixture: ComponentFixture<EditWorkerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditWorkerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWorkerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
