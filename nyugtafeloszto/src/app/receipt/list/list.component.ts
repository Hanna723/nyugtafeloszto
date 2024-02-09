import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Receipt } from 'src/app/shared/models/Receipt';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { ReceiptService } from 'src/app/shared/services/receipt.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, OnDestroy {
  tableData?: Array<Receipt>;
  columnsToDisplay = ['store', 'date', 'sum'];
  user?: string | null;
  receiptSubscription?: Subscription;
  currencySubscriptions: Subscription[] = [];

  constructor(
    private receiptService: ReceiptService,
    private currencyService: CurrencyService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    if (this.user) {
      this.receiptSubscription = this.receiptService
        .getAllForOneUser(JSON.parse(this.user).uid)
        .subscribe((data) => {
          this.tableData = [...data];
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
  }

  ngOnDestroy(): void {
    this.receiptSubscription?.unsubscribe();
    this.currencySubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  navigateToPreview(receipt: Receipt): void {
    this.router.navigateByUrl(`/receipt/${receipt.id}`);
  }
}
