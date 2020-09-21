import { Component, Input, Host, Optional } from '@angular/core';
import { filter } from 'rxjs/operators';
import { SatPopover } from '@ncstate/sat-popover';

@Component({
  selector: 'mev-inline-edit',
  templateUrl: './inline-edit.component.html',
  styleUrls: ['./inline-edit.component.scss']
})
export class InlineEditComponent {
  /** Overrides the val and provides a reset value when changes are cancelled. */
  @Input()
  get value(): string {
    return this._value;
  }
  set value(x: string) {
    this.val = this._value = x;
  }
  private _value = '';

  /** Form model for the input. */
  val = '';

  constructor(@Optional() @Host() public popover: SatPopover) {}

  ngOnInit() {
    // subscribe to cancellations and reset form value
    if (this.popover) {
      this.popover.closed
        .pipe(filter(val => val == null))
        .subscribe(() => (this.val = this.value || ''));
    }
  }

  onSubmit() {
    if (this.popover) {
      this.popover.close(this.val);
    }
  }

  onCancel() {
    if (this.popover) {
      this.popover.close();
    }
  }
}
