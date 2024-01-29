import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { first } from 'rxjs';

import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  collectionName = 'User';

  constructor(private angularFirestore: AngularFirestore) {}

  create(user: User) {
    return this.angularFirestore
      .collection<User>(this.collectionName)
      .doc(user.id)
      .set(user);
  }

  getAll() {
    return this.angularFirestore
      .collection<User>(this.collectionName)
      .valueChanges();
  }

  getById(id: string) {
    return this.angularFirestore
      .collection<User>(this.collectionName)
      .doc(id)
      .valueChanges()
      .pipe(first());
  }

  getByEmail(email: string) {
    return this.angularFirestore
      .collection<User>(this.collectionName, (ref) =>
        ref.where('email', '==', email)
      )
      .valueChanges()
      .pipe(first());
  }

  update(user: User) {
    return this.angularFirestore
      .collection<User>(this.collectionName)
      .doc(user.id)
      .set(user);
  }

  delete(id: string) {
    return this.angularFirestore
      .collection<User>(this.collectionName)
      .doc(id)
      .delete();
  }
}
