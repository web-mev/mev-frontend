import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxPlottingComponent } from './box-plotting.component';

describe('BoxPlottingComponent', () => {
  let component: BoxPlottingComponent;
  let fixture: ComponentFixture<BoxPlottingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BoxPlottingComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxPlottingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
