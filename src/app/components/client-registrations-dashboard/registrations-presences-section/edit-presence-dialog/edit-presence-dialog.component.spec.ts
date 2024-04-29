import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPresenceDialogComponent } from './edit-presence-dialog.component';

describe('EditPresenceDialogComponent', () => {
  let component: EditPresenceDialogComponent;
  let fixture: ComponentFixture<EditPresenceDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditPresenceDialogComponent]
    });
    fixture = TestBed.createComponent(EditPresenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
