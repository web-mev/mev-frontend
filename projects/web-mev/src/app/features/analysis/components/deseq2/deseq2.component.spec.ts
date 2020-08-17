import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Deseq2Component } from './deseq2.component';

describe('Deseq2Component', () => {
  let component: Deseq2Component;
  let fixture: ComponentFixture<Deseq2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [Deseq2Component]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Deseq2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
