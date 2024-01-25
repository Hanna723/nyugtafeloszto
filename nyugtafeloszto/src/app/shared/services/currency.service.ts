import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Currency } from '../models/Currency';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  collectionName = 'Currency';

  constructor(private angularFirestore: AngularFirestore) {}

  getAll() {
    return this.angularFirestore
      .collection<Currency>(this.collectionName, (ref) => ref.orderBy('name'))
      .valueChanges();
  }

  getById(id: string) {
    return this.angularFirestore
      .collection<Currency>(this.collectionName)
      .doc(id)
      .valueChanges();
  }
}
