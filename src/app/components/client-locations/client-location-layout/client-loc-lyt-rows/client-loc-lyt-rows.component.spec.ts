import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientLocLytRowsComponent } from './client-loc-lyt-rows.component';

describe('ClientLocLytRowsComponent', () => {
  let component: ClientLocLytRowsComponent;
  let fixture: ComponentFixture<ClientLocLytRowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientLocLytRowsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientLocLytRowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
