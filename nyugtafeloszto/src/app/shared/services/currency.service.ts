import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, first } from 'rxjs';

import { Currency } from '../models/Currency';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  collectionName = 'Currency';

  constructor(private angularFirestore: AngularFirestore) {}

  getAll(): Observable<Currency[]> {
    return this.angularFirestore
      .collection<Currency>(this.collectionName, (ref) => ref.orderBy('name'))
      .valueChanges();
  }

  getById(id: string): Observable<Currency | undefined> {
    return this.angularFirestore
      .collection<Currency>(this.collectionName)
      .doc(id)
      .valueChanges()
      .pipe(first());
  }
}
