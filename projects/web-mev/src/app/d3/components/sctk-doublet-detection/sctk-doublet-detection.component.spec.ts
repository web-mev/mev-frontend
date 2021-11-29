import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SctkDoubletDetectionComponent } from './sctk-doublet-detection.component';

describe('SctkDoubletDetectionComponent', () => {
  let component: SctkDoubletDetectionComponent;
  let fixture: ComponentFixture<SctkDoubletDetectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SctkDoubletDetectionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SctkDoubletDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
