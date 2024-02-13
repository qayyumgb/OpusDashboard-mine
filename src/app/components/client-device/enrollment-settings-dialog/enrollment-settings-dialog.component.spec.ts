import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentSettingsDialogComponent } from './enrollment-settings-dialog.component';

describe('EnrollmentSettingsDialogComponent', () => {
  let component: EnrollmentSettingsDialogComponent;
  let fixture: ComponentFixture<EnrollmentSettingsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EnrollmentSettingsDialogComponent]
    });
    fixture = TestBed.createComponent(EnrollmentSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
