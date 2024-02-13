import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLayoutDialogComponent } from './edit-layout-dialog.component';

describe('CreateWorkerDialogComponent', () => {
  let component: EditLayoutDialogComponent;
  let fixture: ComponentFixture<EditLayoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditLayoutDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLayoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
