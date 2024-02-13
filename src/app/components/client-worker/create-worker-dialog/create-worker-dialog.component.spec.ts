import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkerDialogComponent } from './create-worker-dialog.component';

describe('CreateWorkerDialogComponent', () => {
  let component: CreateWorkerDialogComponent;
  let fixture: ComponentFixture<CreateWorkerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateWorkerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWorkerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
