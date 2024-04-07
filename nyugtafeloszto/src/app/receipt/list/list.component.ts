import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { createWorker } from 'tesseract.js';

import { Receipt } from 'src/app/shared/models/Receipt';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { ReceiptService } from 'src/app/shared/services/receipt.service';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { Product } from 'src/app/shared/models/Product';
import { Currency } from 'src/app/shared/models/Currency';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileUpload') fileUpload!: ElementRef<HTMLInputElement>;

  progressBar: boolean = false;
  tableData: MatTableDataSource<Receipt> = new MatTableDataSource();
  filteredTableData: MatTableDataSource<Receipt> = new MatTableDataSource();
  columnsToDisplay = ['store', 'date', 'sum'];
  user?: string | null;
  currencies: Array<Currency> = [];
  receiptSubscription?: Subscription;
  dialogSubscription?: Subscription;
  currencySubscriptions: Subscription[] = [];

  constructor(
    private receiptService: ReceiptService,
    private currencyService: CurrencyService,
    private datePipe: DatePipe,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.progressBar = true;
    this.user = localStorage.getItem('user');

    if (!this.user) {
      return;
    }

    const allCurrencySubscription = this.currencyService
      .getAll()
      .subscribe((data) => {
        this.currencies = data;
      });

    this.currencySubscriptions.push(allCurrencySubscription);

    this.receiptSubscription = this.receiptService
      .getAllForOneUser(JSON.parse(this.user))
      .subscribe((data) => {
        this.tableData = new MatTableDataSource(data);
        this.filteredTableData = new MatTableDataSource(data);
        data.forEach((el) => {
          const currencySubscription = this.currencyService
            .getById(el.currency as unknown as string)
            .subscribe((currency) => {
              if (el.date) {
                let date = el.date.toDate();
                el.formattedDate = this.datePipe.transform(
                  date,
                  'yyyy. MM. dd.'
                );
              }
              if (currency) {
                el.currency = currency;
              }
            });
          this.currencySubscriptions.push(currencySubscription);
        });
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sort) {
        this.sort.sort({ id: 'date', start: 'desc', disableClear: false });
      }
      this.progressBar = false;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.receiptSubscription?.unsubscribe();
    this.dialogSubscription?.unsubscribe();
    this.currencySubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  sortData() {
    this.filteredTableData.sort = this.sort;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.value) {
      this.filteredTableData.data = [...this.tableData.data];
      return;
    }

    this.filteredTableData.data = this.tableData.data.filter((el) =>
      el.store.toLowerCase().includes(input.value.toLowerCase())
    );
  }

  openDialog(event: Event) {
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Figyelem!',
        text: `A képről felismert szöveg hibás, esetleg hiányos lehet, 
        ezért kérem minden esetben ellenőrizze az így bevitt adatokat.<br>
        Emellett a feltöltött kép esetén ügyeljen az alábbiakra:
        <ul>
        <li>A kép ne legyen elforgatva</li>
        <li>A képen látható szöveg legyen olvasható</li>
        <li>A képen ne szerepeljen más szöveg a nyugtán kívül</li>
        </ul>`,
        button: 'Mégsem',
        submitButton: 'Képfeltöltés',
      },
    });

    this.dialogSubscription = dialogRef.componentInstance.submitEvent.subscribe(
      () => {
        this.fileUpload.nativeElement.click();
      }
    );
  }

  async uploadImage(event: Event) {
    if (!this.user) {
      return;
    }

    const target = event.target as HTMLInputElement;

    if (!target.files || !target.files[0].type.includes('image/')) {
      this.dialog.open(DialogComponent, {
        data: {
          title: 'Sikertelen fájlfeltöltés!',
          button: 'Ok',
        },
      });
      return;
    }

    this.progressBar = true;
    let receipt: Receipt = {
      store: '',
      user: JSON.parse(this.user),
      products: [],
      sum: 0,
      members: [],
      paid: '',
    };

    const worker = await createWorker('hun');

    if (target.files?.item(0)) {
      const ret = await worker.recognize(target.files[0]);

      let piece = 1;
      let beginning = ret.data.text.toLowerCase().includes('nyugta');
      let end = false;

      ret.data.lines.forEach((line) => {
        if (receipt.store === '') {
          receipt.store = line.text.replace('\n', '');

          if (line.text.toLowerCase().includes('nyugta')) {
            beginning = false;
          }
          return;
        }

        if (line.text.includes('.')) {
          const convertedDate = this.convertToDate(line.words);

          if (convertedDate) {
            receipt.date = convertedDate;
          }
        }

        if (
          line.text.toLowerCase().includes('összesen') ||
          line.text.toLowerCase().includes('fizetendő') ||
          line.text.toLowerCase().includes('összeg')
        ) {
          end = true;
          const sumAndCurrency = this.convertToSumAndCurrency(
            line.text.toLowerCase()
          );

          if (sumAndCurrency.sum) {
            receipt.sum = parseInt(sumAndCurrency.sum);
          }

          if (sumAndCurrency.currency) {
            receipt.currency = sumAndCurrency.currency;
          }

          return;
        }

        if (
          line.text.toLowerCase().includes('cikkszám') ||
          line.text.toLowerCase().includes('sorszám') ||
          line.text.toLowerCase().includes('részösszeg')
        ) {
          return;
        }

        if (line.text.toLowerCase().includes('nyugta')) {
          beginning = false;
          return;
        }

        if (!end && !beginning) {
          if (Number(line.words[0].text)) {
            piece = parseInt(line.words[0].text);
          } else {
            const product = this.convertToProduct(line, piece);

            if (product) {
              receipt.products.push(product);
              piece = 1;
            }
          }
        }
      });
    }
    await worker.terminate().then(() => {
      localStorage.setItem('receipt', JSON.stringify(receipt));
      this.progressBar = false;
      this.router.navigateByUrl('/receipt/upload');
    });
  }

  convertToDate(words: any) {
    let date = '';
    words.forEach((word: any) => {
      if (word.text.includes('.')) {
        date += word.text;
      }
    });
    const convertedDate = new Date(date);
    return Timestamp.fromDate(convertedDate);
  }

  convertToSumAndCurrency(text: string) {
    text = text.replace(':', '');
    text = text.replace('\n', '');
    text = text.replace(/\s{2,}/g, ' ');

    let words = text.split(' ');
    let number = '';
    let convertedCurrency;

    for (let i = 0; i < words.length; i++) {
      if (Number(words[i])) {
        number += words[i];
      } else {
        convertedCurrency = this.currencies.find(
          (el) =>
            el.name.toLowerCase() === words[i] ||
            el.symbol.toLowerCase() === words[i]
        );
      }
    }

    return {
      sum: number,
      currency: convertedCurrency,
    };
  }

  convertToProduct(line: any, piece: number): Product | null {
    let number: string[] = [];

    for (let i = line.words.length - 1; i >= 0; i--) {
      if (Number(line.words[i].text) || line.words[i].text === '-') {
        number.unshift(line.words[i].text);
      } else if (!Number(line.words[i].text) && number.length !== 0) {
        break;
      }
    }

    const name = line.text.substring(0, line.text.indexOf(number.join()));

    if (!name || number.length === 0) {
      return null;
    }

    const product: Product = {
      name: name,
      piece: piece,
      price: parseInt(number.join()),
      pays: [],
    };

    return product;
  }

  navigateToPreview(receipt: Receipt): void {
    this.router.navigateByUrl(`/receipt/${receipt.id}`);
  }
}
