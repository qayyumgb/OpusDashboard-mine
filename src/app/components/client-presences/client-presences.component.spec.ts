import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientPresencesComponent } from './client-presences.component';

describe('ClientPresencesComponent', () => {
  let component: ClientPresencesComponent;
  let fixture: ComponentFixture<ClientPresencesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ClientPresencesComponent]
    });
    fixture = TestBed.createComponent(ClientPresencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
