import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContinuousDistributionDisplayComponent } from './continuous-distribution-display.component';

describe('ContinuousDistributionDisplayComponent', () => {
  let component: ContinuousDistributionDisplayComponent;
  let fixture: ComponentFixture<ContinuousDistributionDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContinuousDistributionDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContinuousDistributionDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
