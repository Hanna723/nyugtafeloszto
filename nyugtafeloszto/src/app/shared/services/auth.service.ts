import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: AngularFireAuth) {}

  sendVerificationEmail(): Promise<void | undefined> {
    return this.auth.currentUser.then((user) => {
      return user?.sendEmailVerification();
    });
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return this.auth.sendPasswordResetEmail(email);
  }

  login(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  signup(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  isLoggedIn(): Observable<firebase.User | null> {
    return this.auth.user;
  }

  logOut(): Promise<void> {
    return this.auth.signOut();
  }

  delete(): Promise<void> {
    return this.auth.currentUser.then((user) => {
      user?.delete();
    });
  }
}
