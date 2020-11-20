import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HclComponent } from './hcl.component';

describe('HclComponent', () => {
  let component: HclComponent;
  let fixture: ComponentFixture<HclComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HclComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HclComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
