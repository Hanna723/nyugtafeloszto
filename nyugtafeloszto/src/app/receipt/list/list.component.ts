import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
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
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  tableData: MatTableDataSource<Receipt> = new MatTableDataSource();
  filteredTableData: MatTableDataSource<Receipt> = new MatTableDataSource();
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
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sort) {
        this.sort.sort({ id: 'date', start: 'desc', disableClear: false });
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.receiptSubscription?.unsubscribe();
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

  navigateToPreview(receipt: Receipt): void {
    this.router.navigateByUrl(`/receipt/${receipt.id}`);
  }
}
