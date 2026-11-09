import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

const DEFAULT_OTP_LENGTH = 6;

@Component({
  selector: 'app-otp-code-input',
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './otp-code-input.component.html',
  styleUrl: './otp-code-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpCodeInputComponent implements OnInit {
  readonly length = input(DEFAULT_OTP_LENGTH);
  readonly disabled = input(false);
  readonly codeChange = output<string>();
  readonly enterPressed = output<void>();

  private readonly otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

  readonly otpIndexes = computed(() =>
    Array.from({ length: this.length() }, (_, i) => i),
  );

  readonly otpDigits = signal(new FormArray<FormControl<string>>([]));

  constructor() {
    effect(() => {
      const disabled = this.disabled();
      const digits = this.otpDigits();
      if (digits.length === 0) {
        return;
      }
      if (disabled) {
        digits.disable({ emitEvent: false });
      } else {
        digits.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.rebuildControls();
    setTimeout(() => this.focusOtp(0));
  }

  otpControl(index: number): FormControl<string> {
    return this.otpDigits().at(index);
  }

  isInvalid(): boolean {
    return this.otpDigits().invalid;
  }

  codeValue(): string {
    return this.otpDigits()
      .controls.map((c) => c.value)
      .join('');
  }

  reset(): void {
    const len = this.length();
    this.otpDigits().reset(Array.from({ length: len }, () => ''));
    this.emitCode();
    setTimeout(() => this.focusOtp(0));
  }

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = this.normalizeDigits(input.value);
    const digits = this.otpDigits();
    const len = this.length();

    if (!value) {
      digits.at(index).setValue('');
      this.emitCode();
      return;
    }

    if (value.length > 1) {
      const chunk = value.slice(0, len - index).split('');
      chunk.forEach((digit, offset) => {
        digits.at(index + offset).setValue(digit, { emitEvent: false });
      });
      digits.updateValueAndValidity();
      this.focusOtp(Math.min(index + chunk.length, len - 1));
      this.emitCode();
      return;
    }

    digits.at(index).setValue(value, { emitEvent: false });
    input.value = value;
    if (index < len - 1) {
      this.focusOtp(index + 1);
    }
    this.emitCode();
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.enterPressed.emit();
      return;
    }

    const digits = this.otpDigits();
    const value = digits.at(index).value;
    const len = this.length();
    const allowed = ['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Backspace', 'Delete'];

    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) {
      if (event.key === 'Backspace' && !value && index > 0) {
        event.preventDefault();
        digits.at(index - 1).setValue('');
        this.focusOtp(index - 1);
        this.emitCode();
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        this.focusOtp(index - 1);
      } else if (event.key === 'ArrowRight' && index < len - 1) {
        event.preventDefault();
        this.focusOtp(index + 1);
      }
      return;
    }

    if (event.key.length === 1 && !/[0-9٠-٩]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onOtpPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const len = this.length();
    const pasted = this.normalizeDigits(event.clipboardData?.getData('text') ?? '')
      .slice(0, len - index)
      .split('');
    if (!pasted.length) {
      return;
    }
    const digits = this.otpDigits();
    pasted.forEach((digit, offset) => {
      digits.at(index + offset).setValue(digit, { emitEvent: false });
    });
    digits.updateValueAndValidity();
    this.focusOtp(Math.min(index + pasted.length, len - 1));
    this.emitCode();
  }

  private rebuildControls(): void {
    const len = this.length();
    const array = new FormArray(
      Array.from({ length: len }, () =>
        new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.pattern(/^\d$/)],
        }),
      ),
    );
    this.otpDigits.set(array);
  }

  private emitCode(): void {
    this.codeChange.emit(this.codeValue());
  }

  private normalizeDigits(value: string): string {
    const eastern = '٠١٢٣٤٥٦٧٨٩';
    return value
      .split('')
      .map((ch) => {
        const idx = eastern.indexOf(ch);
        return idx > -1 ? String(idx) : ch;
      })
      .join('')
      .replace(/\D/g, '');
  }

  private focusOtp(index: number): void {
    const el = this.otpInputs()[index]?.nativeElement;
    el?.focus();
    el?.select();
  }
}
