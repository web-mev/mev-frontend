import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactorDisplayComponent } from './factor-display.component';

describe('FactorDisplayComponent', () => {
  let component: FactorDisplayComponent;
  let fixture: ComponentFixture<FactorDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FactorDisplayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FactorDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
