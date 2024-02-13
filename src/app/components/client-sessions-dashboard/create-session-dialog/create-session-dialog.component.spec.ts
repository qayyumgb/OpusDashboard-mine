import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSessionDialogComponent } from './create-session-dialog.component';

describe('CreateSessionDialogComponent', () => {
  let component: CreateSessionDialogComponent;
  let fixture: ComponentFixture<CreateSessionDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateSessionDialogComponent]
    });
    fixture = TestBed.createComponent(CreateSessionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
