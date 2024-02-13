import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevClientComponent } from './dev-client.component';

describe('DevClientComponent', () => {
  let component: DevClientComponent;
  let fixture: ComponentFixture<DevClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DevClientComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
