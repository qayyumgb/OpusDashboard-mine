import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaborTrolleySectionComponent } from './labor-trolley-section.component';

describe('LaborTrolleySectionComponent', () => {
  let component: LaborTrolleySectionComponent;
  let fixture: ComponentFixture<LaborTrolleySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaborTrolleySectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaborTrolleySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
