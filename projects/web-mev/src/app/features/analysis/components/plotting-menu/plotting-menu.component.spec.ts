import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MevWorkspacePlotComponent } from './mev-workspace-plot.component';

describe('MevWorkspacePlotComponent', () => {
  let component: MevWorkspacePlotComponent;
  let fixture: ComponentFixture<MevWorkspacePlotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MevWorkspacePlotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MevWorkspacePlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
