import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MevBaseExpressionPlotFormComponent } from './base-expression-plot-form.component';

describe('MevBaseExpressionPlotFormComponent', () => {
  let component: MevBaseExpressionPlotFormComponent;
  let fixture: ComponentFixture<MevBaseExpressionPlotFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MevBaseExpressionPlotFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MevBaseExpressionPlotFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
