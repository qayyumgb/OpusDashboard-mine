import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevTrainingComponent } from './dev-training.component';

describe('DevTrainingComponent', () => {
  let component: DevTrainingComponent;
  let fixture: ComponentFixture<DevTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DevTrainingComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
