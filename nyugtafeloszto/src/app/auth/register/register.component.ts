import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FirebaseError } from '@firebase/util';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from 'src/app/shared/services/auth.service';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/User';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  hide: boolean = true;
  registrationForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  constructor(
    private authService: AuthService,
    private userService: UserService,
    public dialog: MatDialog
  ) {}

  onSubmit(): void {
    this.authService
      .signup(
        this.registrationForm.controls['email'].value,
        this.registrationForm.controls['password'].value
      )
      .then((credentials) => {
        const user: User = {
          id: credentials.user?.uid as string,
          email: this.registrationForm.controls['email'].value,
        };
        this.userService
          .create(user)
          .then(() => {
            this.authService.logOut();
            this.openDialog();
          })
          .catch((err) => {
            this.handleError(err);
          });
      })
      .catch((err) => {
        this.handleError(err);
      });
  }

  openDialog(): void {
    this.dialog.open(DialogComponent, {
      data: {
        title: 'Sikeres regisztráció!',
        button: 'Ok',
        link: 'auth/login'
      },
    });
  }

  handleError(err: { code: any }): void {
    let errorName = 'error';
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/invalid-email': {
          errorName = 'format';
          break;
        }
        case 'auth/email-already-in-use': {
          errorName = 'taken';
          break;
        }
      }
    }
    this.registrationForm.controls['email'].setErrors({ [errorName]: true });
  }
}
