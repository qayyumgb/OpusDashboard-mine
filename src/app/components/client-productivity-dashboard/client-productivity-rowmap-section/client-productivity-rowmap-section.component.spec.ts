import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProductivityRowmapSectionComponent } from './client-productivity-rowmap-section.component';

describe('ClientRowmapSectionComponent', () => {
  let component: ClientProductivityRowmapSectionComponent;
  let fixture: ComponentFixture<ClientProductivityRowmapSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientProductivityRowmapSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProductivityRowmapSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
