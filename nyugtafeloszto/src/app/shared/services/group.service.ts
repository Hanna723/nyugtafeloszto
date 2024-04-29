import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, first } from 'rxjs';

import { Group } from '../models/Group';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  collectionName = 'Group';

  constructor(private angularFirestore: AngularFirestore) {}

  create(group: Group): Promise<void> {
    group.id = this.angularFirestore.createId();
    return this.angularFirestore
      .collection<Group>(this.collectionName)
      .doc(group.id)
      .set(group);
  }

  update(group: Group): Promise<void> {
    return this.angularFirestore
      .collection<Group>(this.collectionName)
      .doc(group.id)
      .update(group);
  }

  delete(id: string): Promise<void> {
    return this.angularFirestore
      .collection<Group>(this.collectionName)
      .doc(id)
      .delete();
  }

  getAllForOneUser(userId: string): Observable<Group[]> {
    return this.angularFirestore
      .collection<Group>(this.collectionName, (ref) =>
        ref.where('user', '==', userId)
      )
      .valueChanges();
  }

  getByMember(userId: string, memberId: string): Observable<Group[]> {
    return this.angularFirestore
      .collection<Group>(this.collectionName, (ref) =>
        ref
          .where('user', '==', userId)
          .where('members', 'array-contains', memberId)
      )
      .valueChanges();
  }

  getById(id: string, userId: string): Observable<Group | undefined> {
    return this.angularFirestore
      .collection<Group>(this.collectionName, (ref) =>
        ref.where('user', '==', userId)
      )
      .doc(id)
      .valueChanges()
      .pipe(first());
  }
}
