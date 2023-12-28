import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Group } from '../models/Group';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  collectionName = 'Group';

  constructor(private angularFirestore: AngularFirestore) {}

  create(group: Group) {
    return this.angularFirestore
      .collection<Group>(this.collectionName)
      .add(group);
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
        ref.where('user', '==', userId)
      )
      .valueChanges();
  }
}
