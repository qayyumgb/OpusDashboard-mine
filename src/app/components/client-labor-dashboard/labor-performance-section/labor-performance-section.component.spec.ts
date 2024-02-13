import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaborPerformanceSectionComponent } from './labor-performance-section.component';

describe('LaborPerformanceChartComponent', () => {
  let component: LaborPerformanceSectionComponent;
  let fixture: ComponentFixture<LaborPerformanceSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaborPerformanceSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LaborPerformanceSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
