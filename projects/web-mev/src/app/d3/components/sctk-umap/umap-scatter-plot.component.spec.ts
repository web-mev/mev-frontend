import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UmapScatterPlotComponent } from './umap-scatter-plot.component';

describe('ScatterPlotComponent', () => {
  let component: UmapScatterPlotComponent;
  let fixture: ComponentFixture<UmapScatterPlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UmapScatterPlotComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UmapScatterPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
