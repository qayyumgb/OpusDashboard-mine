import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevWorkerComponent } from './dev-worker.component';

describe('WorkerComponent', () => {
  let component: DevWorkerComponent;
  let fixture: ComponentFixture<DevWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DevWorkerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
