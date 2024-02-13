import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaborProductivitySectionComponent } from './labor-productivity-section.component';

describe('LaborProductivitySectionComponent', () => {
  let component: LaborProductivitySectionComponent;
  let fixture: ComponentFixture<LaborProductivitySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaborProductivitySectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaborProductivitySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
