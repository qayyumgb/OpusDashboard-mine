import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLocationDialogComponent } from './edit-location-dialog.component';

describe('EditLocationDialogComponent', () => {
  let component: EditLocationDialogComponent;
  let fixture: ComponentFixture<EditLocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditLocationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
