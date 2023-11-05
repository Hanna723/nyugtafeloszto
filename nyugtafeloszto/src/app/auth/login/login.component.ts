import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  hide: boolean = true;
  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(),
  });

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    let rememberedEmail: string | null = localStorage.getItem('email');

    if (rememberedEmail) {
      this.loginForm.controls['email'].setValue(rememberedEmail);
    }
  }

  onSubmit(): void {
    if (this.loginForm.controls['rememberMe'].value) {
      localStorage.setItem('email', this.loginForm.controls['email'].value);
    }

    this.authService
      .login(
        this.loginForm.controls['email'].value,
        this.loginForm.controls['password'].value
      )
      .then(() => {
        this.router.navigateByUrl('/home');
      })
      .catch((err) => {
        this.loginForm.controls['password'].setErrors({ wrong: true });
      });
  }
}
