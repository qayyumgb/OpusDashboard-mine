import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientTrainingComponent } from './client-training.component';

describe('ClientTrainingComponent', () => {
  let component: ClientTrainingComponent;
  let fixture: ComponentFixture<ClientTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientTrainingComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
