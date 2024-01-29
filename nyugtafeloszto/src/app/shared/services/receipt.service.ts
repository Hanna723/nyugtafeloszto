import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { first } from 'rxjs';

import { Receipt } from '../models/Receipt';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  collectionName = 'Receipt';

  constructor(private angularFirestore: AngularFirestore) {}

  create(receipt: Receipt) {
    receipt.id = this.angularFirestore.createId();
    this.angularFirestore
      .collection<Receipt>(this.collectionName)
      .doc(receipt.id)
      .set(receipt);
    return receipt.id;
  }

  update(receipt: Receipt) {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName)
      .doc(receipt.id)
      .update(receipt);
  }

  delete(id: string) {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName)
      .doc(id)
      .delete();
  }

  getAllForOneUser(userId: string) {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName, (ref) =>
        ref.where('user', '==', userId).orderBy('date')
      )
      .valueChanges();
  }

  getById(id: string, userId: string) {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName, (ref) =>
        ref.where('user', '==', userId).orderBy('date')
      )
      .doc(id)
      .valueChanges()
      .pipe(first());
  }
}