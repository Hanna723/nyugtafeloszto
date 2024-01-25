import { Timestamp } from "firebase/firestore";
import { Currency } from "./Currency";
import { Product } from "./Product";

export interface Receipt {
    id?: string;
    currency: Currency;
    date: Timestamp;
    formattedDate?: string | null;
    store: string;
    user: string;
    products: Array<Product>;
    sum: number;
}