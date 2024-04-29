import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaborPresencesSectionComponent } from './labor-presences-section.component';

describe('LaborPresencesSectionComponent', () => {
  let component: LaborPresencesSectionComponent;
  let fixture: ComponentFixture<LaborPresencesSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LaborPresencesSectionComponent]
    });
    fixture = TestBed.createComponent(LaborPresencesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
