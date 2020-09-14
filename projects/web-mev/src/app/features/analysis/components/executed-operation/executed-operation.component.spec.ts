import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutedOperationComponent } from './executed-operation.component';

describe('ExecutedOperationComponent', () => {
  let component: ExecutedOperationComponent;
  let fixture: ComponentFixture<ExecutedOperationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExecutedOperationComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutedOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
