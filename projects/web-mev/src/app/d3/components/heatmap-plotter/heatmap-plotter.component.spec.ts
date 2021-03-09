import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatmapPlotterComponent } from './heatmap-plotter.component';

describe('HeatmapPlotterComponent', () => {
  let component: HeatmapPlotterComponent;
  let fixture: ComponentFixture<HeatmapPlotterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeatmapPlotterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeatmapPlotterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
