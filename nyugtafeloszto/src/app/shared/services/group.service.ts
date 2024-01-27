import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Group } from '../models/Group';
import { first } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  collectionName = 'Group';

  constructor(private angularFirestore: AngularFirestore) {}

  create(group: Group) {
    group.id = this.angularFirestore.createId();
    return this.angularFirestore
      .collection<Group>(this.collectionName)
      .doc(group.id)
      .set(group);
  }

  update(group: Group) {
    return this.angularFirestore
      .collection<Group>(this.collectionName)
      .doc(group.id)
      .update(group);
  }

  delete(id: string) {
    return this.angularFirestore
      .collection<Group>(this.collectionName)
      .doc(id)
      .delete();
  }

  getAllForOneUser(userId: string) {
    return this.angularFirestore
      .collection<Group>(this.collectionName, (ref) =>
        ref.where('user', '==', userId).orderBy('name')
      )
      .valueChanges();
  }

  getById(id: string, userId: string) {
    return this.angularFirestore
      .collection<Group>(this.collectionName, (ref) =>
        ref.where('user', '==', userId)
      )
      .doc(id)
      .valueChanges()
      .pipe(first());
  }
}
