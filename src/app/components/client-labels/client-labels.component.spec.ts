import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientLabelsComponent } from './client-labels.component';

describe('ClientLabelsComponent', () => {
  let component: ClientLabelsComponent;
  let fixture: ComponentFixture<ClientLabelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientLabelsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientLabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
