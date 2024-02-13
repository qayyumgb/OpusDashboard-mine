import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditVarietyDialogComponent } from './edit-variety-dialog.component';

describe('EditVarietyDialogComponent', () => {
  let component: EditVarietyDialogComponent;
  let fixture: ComponentFixture<EditVarietyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditVarietyDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditVarietyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
