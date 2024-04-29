import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridModalComponent } from './grid-modal.component';

describe('GridModalComponent', () => {
  let component: GridModalComponent;
  let fixture: ComponentFixture<GridModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GridModalComponent]
    });
    fixture = TestBed.createComponent(GridModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
