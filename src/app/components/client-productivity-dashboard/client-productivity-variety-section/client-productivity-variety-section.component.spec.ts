import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProductivityVarietySectionComponent } from './client-productivity-variety-section.component';

describe('ClientProductivityVarietySectionComponent', () => {
  let component: ClientProductivityVarietySectionComponent;
  let fixture: ComponentFixture<ClientProductivityVarietySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientProductivityVarietySectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProductivityVarietySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
