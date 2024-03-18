import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseSpatialgeComponent } from './base-spatialge.component';

describe('BaseSpatialgeComponent', () => {
  let component: BaseSpatialgeComponent;
  let fixture: ComponentFixture<BaseSpatialgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaseSpatialgeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseSpatialgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
