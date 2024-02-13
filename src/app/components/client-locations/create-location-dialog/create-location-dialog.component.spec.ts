import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateLocationDialogComponent } from './create-location-dialog.component';

describe('CreateWorkerDialogComponent', () => {
  let component: CreateLocationDialogComponent;
  let fixture: ComponentFixture<CreateLocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateLocationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateLocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
