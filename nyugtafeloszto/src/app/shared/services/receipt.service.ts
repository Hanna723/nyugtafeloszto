import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, first } from 'rxjs';

import { Receipt } from '../models/Receipt';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  collectionName = 'Receipt';

  constructor(private angularFirestore: AngularFirestore) {}

  create(receipt: Receipt): string {
    receipt.id = this.angularFirestore.createId();
    this.angularFirestore
      .collection<Receipt>(this.collectionName)
      .doc(receipt.id)
      .set(receipt);
    return receipt.id;
  }

  update(receipt: Receipt): Promise<void> {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName)
      .doc(receipt.id)
      .update(receipt);
  }

  delete(id: string): Promise<void> {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName)
      .doc(id)
      .delete();
  }

  getAllForOneUser(userId: string): Observable<Receipt[]> {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName, (ref) =>
        ref.where('user', '==', userId)
      )
      .valueChanges();
  }

  getById(id: string, userId: string): Observable<Receipt | undefined> {
    return this.angularFirestore
      .collection<Receipt>(this.collectionName, (ref) =>
        ref.where('user', '==', userId)
      )
      .doc(id)
      .valueChanges()
      .pipe(first());
  }
}
