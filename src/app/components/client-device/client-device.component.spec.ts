import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDeviceComponent } from './client-device.component';

describe('ClientDeviceComponent', () => {
  let component: ClientDeviceComponent;
  let fixture: ComponentFixture<ClientDeviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientDeviceComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
