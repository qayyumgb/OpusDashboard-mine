import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSessionDialogComponent } from './edit-session-dialog.component';

describe('EditSessionDialogComponent', () => {
  let component: EditSessionDialogComponent;
  let fixture: ComponentFixture<EditSessionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditSessionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSessionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
