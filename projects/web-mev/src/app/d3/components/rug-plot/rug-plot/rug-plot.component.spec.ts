import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RugPlotComponent } from './rug-plot.component';

describe('RugPlotComponent', () => {
  let component: RugPlotComponent;
  let fixture: ComponentFixture<RugPlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RugPlotComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RugPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
