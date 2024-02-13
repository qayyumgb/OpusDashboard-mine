import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientTasksComponent } from './client-tasks.component';

describe('ClientTasksComponent', () => {
  let component: ClientTasksComponent;
  let fixture: ComponentFixture<ClientTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientTasksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
