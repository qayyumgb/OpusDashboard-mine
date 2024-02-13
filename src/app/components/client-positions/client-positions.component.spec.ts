import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientPositionsComponent } from './client-positions.component';

describe('ClientPositionsComponent', () => {
  let component: ClientPositionsComponent;
  let fixture: ComponentFixture<ClientPositionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientPositionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientPositionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
