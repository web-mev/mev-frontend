import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisFlowComponent } from './analysis-flow.component';

describe('AnalysisFlowComponent', () => {
  let component: AnalysisFlowComponent;
  let fixture: ComponentFixture<AnalysisFlowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisFlowComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
