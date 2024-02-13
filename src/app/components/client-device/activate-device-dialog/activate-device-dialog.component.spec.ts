import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivateDeviceDialogComponent } from './activate-device-dialog.component';

describe('CreateDeviceDialogComponent', () => {
  let component: ActivateDeviceDialogComponent;
  let fixture: ComponentFixture<ActivateDeviceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActivateDeviceDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivateDeviceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
