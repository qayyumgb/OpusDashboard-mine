import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevActivityComponent } from './dev-activity.component';

describe('ModelComponent', () => {
  let component: DevActivityComponent;
  let fixture: ComponentFixture<DevActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DevActivityComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
