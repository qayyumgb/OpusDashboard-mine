import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProductivityRowSectionComponent } from './client-productivity-row-section.component';

describe('ClientProductivityRowSectionComponent', () => {
  let component: ClientProductivityRowSectionComponent;
  let fixture: ComponentFixture<ClientProductivityRowSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientProductivityRowSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProductivityRowSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
