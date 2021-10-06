import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CombatseqComponent } from './combatseq.component';

describe('CombatseqComponent', () => {
  let component: CombatseqComponent;
  let fixture: ComponentFixture<CombatseqComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CombatseqComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CombatseqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
