import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaborOverviewSectionComponent } from './labor-overview-section.component';

describe('LaborOverviewSectionComponent', () => {
  let component: LaborOverviewSectionComponent;
  let fixture: ComponentFixture<LaborOverviewSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaborOverviewSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaborOverviewSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
