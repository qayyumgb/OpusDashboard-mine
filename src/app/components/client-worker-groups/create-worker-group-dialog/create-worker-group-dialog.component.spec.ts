import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkerGroupDialogComponent } from './create-worker-group-dialog.component';

describe('CreateWorkerGroupDialogComponent', () => {
  let component: CreateWorkerGroupDialogComponent;
  let fixture: ComponentFixture<CreateWorkerGroupDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateWorkerGroupDialogComponent]
    });
    fixture = TestBed.createComponent(CreateWorkerGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
