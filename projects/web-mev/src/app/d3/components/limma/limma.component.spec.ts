import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LimmaComponent } from './limma.component';

describe('LimmaComponent', () => {
  let component: LimmaComponent;
  let fixture: ComponentFixture<LimmaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LimmaComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LimmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
