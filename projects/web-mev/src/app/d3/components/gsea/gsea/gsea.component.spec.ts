import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GseaComponent } from './gsea.component';

describe('GseaComponent', () => {
  let component: GseaComponent;
  let fixture: ComponentFixture<GseaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GseaComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GseaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
