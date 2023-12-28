import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Member } from '../models/Member';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  collectionName = 'Member';

  constructor(private angularFirestore: AngularFirestore) {}

  create(member: Member) {
    return this.angularFirestore
      .collection<Member>(this.collectionName)
      .add(member);
  }

  delete(id: string) {
    return this.angularFirestore
      .collection<Member>(this.collectionName)
      .doc(id)
      .delete();
  }

  getAllForOneUser(userId: string) {
    return this.angularFirestore.collection<Member>(
      this.collectionName,
      (ref) => ref.where('user', '==', userId).orderBy('name')
    ).valueChanges();
  }
}
