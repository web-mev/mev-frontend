import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisPlottingResultComponent } from './analysis-plotting-result.component';

describe('AnalysisPlottingResultComponent', () => {
  let component: AnalysisPlottingResultComponent;
  let fixture: ComponentFixture<AnalysisPlottingResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisPlottingResultComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisPlottingResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
