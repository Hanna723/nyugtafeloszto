import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { AuthService } from 'src/app/shared/services/auth.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss'],
})
export class PasswordResetComponent {
  @Output() progressEvent = new EventEmitter();
  passwordResetForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required]),
  });

  constructor(
    private authService: AuthService,
    private userService: UserService,
    public dialogRef: MatDialogRef<PasswordResetComponent>
  ) {}

  onSubmit(): void {
    const email = this.passwordResetForm.controls['email'].value;

    if (!email) {
      return;
    }

    this.progressEvent.emit(true);

    this.userService.getByEmail(email).subscribe((user) => {
      if (user.length === 0) {
        this.passwordResetForm.controls['email'].setErrors({ wrong: true });
        this.progressEvent.emit(false);
        return;
      }
      this.authService.sendPasswordResetEmail(email).then(() => {
        this.progressEvent.emit(false);
        this.close();
      });
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
