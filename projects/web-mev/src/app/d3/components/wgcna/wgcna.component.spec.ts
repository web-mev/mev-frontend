import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WgcnaComponent } from './wgcna.component';

describe('WgcnaComponent', () => {
  let component: WgcnaComponent;
  let fixture: ComponentFixture<WgcnaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WgcnaComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WgcnaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
