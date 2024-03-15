import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import firebase from 'firebase/compat/app';

import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-edit',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss'],
})
export class PasswordChangeComponent implements OnInit {
  @Output() progressEvent = new EventEmitter();
  hideOld: boolean = true;
  hideNew: boolean = true;
  user?: firebase.User;
  editForm: FormGroup = new FormGroup({
    oldPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  constructor(
    private authService: AuthService,
    public dialogRef: MatDialogRef<PasswordChangeComponent>
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe((user) => {
      if (user) {
        this.user = user;
      }
    });
  }

  onSubmit() {
    if (!this.user) {
      return;
    }

    const credentials = firebase.auth.EmailAuthProvider.credential(
      this.user?.email || '',
      this.editForm.controls['oldPassword'].value
    );

    this.user.reauthenticateWithCredential(credentials).then(
      (success) => {
        if (!this.user) {
          return;
        }
        this.progressEvent.emit(true);

        this.user
          .updatePassword(this.editForm.controls['newPassword'].value)
          .then(() => {
            this.progressEvent.emit(false);
            this.close();
          })
          .catch(() => {
            this.progressEvent.emit(false);
            
            this.editForm.controls['newPassword'].setErrors({
              incorrect: 'true',
            });
          });
      },
      (error) => {
        if (error.code === 'auth/invalid-login-credentials') {
          this.editForm.controls['oldPassword'].setErrors({
            incorrect: 'true',
          });
        }
      }
    );
  }

  close(): void {
    this.dialogRef.close();
  }
}
