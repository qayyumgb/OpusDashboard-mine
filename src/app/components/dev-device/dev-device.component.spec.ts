import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevDeviceComponent } from './dev-device.component';

describe('DeviceComponent', () => {
  let component: DevDeviceComponent;
  let fixture: ComponentFixture<DevDeviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DevDeviceComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
