import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DifferentialExpressionComponent } from './differential_expression.component';

describe('DifferentialExpressionComponent', () => {
  let component: DifferentialExpressionComponent;
  let fixture: ComponentFixture<DifferentialExpressionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DifferentialExpressionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DifferentialExpressionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
