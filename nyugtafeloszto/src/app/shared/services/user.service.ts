import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  collectionName = 'Felhasznalo';

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
      .valueChanges();
  }

  getByEmail(email: string) {
    return this.angularFirestore
      .collection<User>(this.collectionName, (ref) =>
        ref.where('email', '==', email)
      )
      .valueChanges();
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
