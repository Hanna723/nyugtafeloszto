import { Timestamp } from 'firebase/firestore';

import { Currency } from './Currency';
import { Product } from './Product';
import { Member } from './Member';

export interface Receipt {
  id?: string;
  currency?: Currency | string;
  date?: Timestamp;
  formattedDate?: string | null;
  store: string;
  user: string;
  products: Array<Product>;
  sum: number;
  members: Array<Member> | Array<string>;
  paid: string;
}
