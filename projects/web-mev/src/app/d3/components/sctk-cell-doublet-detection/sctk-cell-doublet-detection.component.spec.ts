import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SctkCellDoubletDetectionComponent } from './sctk-cell-doublet-detection.component';

describe('SctkCellDoubletDetectionComponent', () => {
  let component: SctkCellDoubletDetectionComponent;
  let fixture: ComponentFixture<SctkCellDoubletDetectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SctkCellDoubletDetectionComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SctkCellDoubletDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
