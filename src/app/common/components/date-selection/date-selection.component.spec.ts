import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateSelectionComponent } from './date-selection.component';

describe('DateSelectionComponent', () => {
  let component: DateSelectionComponent;
  let fixture: ComponentFixture<DateSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DateSelectionComponent]
    });
    fixture = TestBed.createComponent(DateSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
