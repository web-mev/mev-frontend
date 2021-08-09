import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SctkCxdsDoubletDetectionComponent } from './sctk-cxds-doublet-detection.component';

describe('SctkCxdsDoubletDetectionComponent', () => {
  let component: SctkCxdsDoubletDetectionComponent;
  let fixture: ComponentFixture<SctkCxdsDoubletDetectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SctkCxdsDoubletDetectionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SctkCxdsDoubletDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
