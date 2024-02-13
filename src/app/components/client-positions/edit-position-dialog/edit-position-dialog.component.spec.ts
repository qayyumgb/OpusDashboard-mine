import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPositionDialogComponent } from './edit-position-dialog.component';

describe('EditPositionDialogComponent', () => {
  let component: EditPositionDialogComponent;
  let fixture: ComponentFixture<EditPositionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditPositionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPositionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
