import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopgoComponent } from './topgo.component';

describe('TopgoComponent', () => {
  let component: TopgoComponent;
  let fixture: ComponentFixture<TopgoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TopgoComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopgoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
