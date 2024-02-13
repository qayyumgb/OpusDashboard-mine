import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleDeviceEditComponent } from './multiple-device-edit.component';

describe('MultipleDeviceEditComponent', () => {
  let component: MultipleDeviceEditComponent;
  let fixture: ComponentFixture<MultipleDeviceEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MultipleDeviceEditComponent]
    });
    fixture = TestBed.createComponent(MultipleDeviceEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
