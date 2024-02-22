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
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';

import { Member } from 'src/app/shared/models/Member';
import { Receipt } from 'src/app/shared/models/Receipt';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { ReceiptService } from 'src/app/shared/services/receipt.service';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
})
export class PreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('download') download!: ElementRef<HTMLAnchorElement>;
  user?: string | null;
  receipt?: Receipt;
  needToPay: Map<string, number> = new Map();
  members: Array<Member> = [];
  tableData: MatTableDataSource<Member> = new MatTableDataSource();
  columnsToDisplay = ['name', 'pays'];
  downloadHref?: SafeUrl;

  receiptSubscription?: Subscription;
  currencySubscription?: Subscription;
  memberSubscription?: Subscription;
  submitSubscription?: Subscription;

  constructor(
    private receiptService: ReceiptService,
    private memberService: MemberService,
    private currencyService: CurrencyService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    public deleteDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');
    const id = this.route.snapshot.params['id'];

    if (this.user && id) {
      this.receiptSubscription = this.receiptService
        .getById(id, this.user)
        .subscribe((data) => {
          this.receipt = data;
          this.currencySubscription = this.currencyService
            .getById(data?.currency as unknown as string)
            .subscribe((currency) => {
              if (data?.date) {
                let date = data.date.toDate();
                data.formattedDate = this.datePipe.transform(
                  date,
                  'yyyy. MM. dd.'
                );
              }
              if (currency && data) {
                data.currency = currency;
              }
            });
          this.calculatePrices();
          this.getMembersFromReceipt();
        });
    } else {
      this.router.navigateByUrl('/receipt/list');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.tableData = new MatTableDataSource(this.members);
      setTimeout(() => {
        this.sort.sort({ id: 'pays', start: 'asc', disableClear: false });
      });
    }, 900);
  }

  ngOnDestroy(): void {
    this.receiptSubscription?.unsubscribe();
    this.currencySubscription?.unsubscribe();
    this.memberSubscription?.unsubscribe();
    this.submitSubscription?.unsubscribe();
  }

  sortData() {
    this.tableData.sort = this.sort;
  }

  getMembersFromReceipt() {
    this.receipt?.members.forEach((memberId) => {
      if (this.user) {
        this.memberSubscription = this.memberService
          .getById(memberId, this.user)
          .subscribe((member) => {
            if (member && member.id) {
              member.pays = this.needToPay.get(member.id) || 0;
              this.members.push(member);
            }
          });
      }
    });
  }

  calculatePrices() {
    this.receipt?.members.forEach((member) => {
      this.needToPay.set(member, 0);
    });

    this.receipt?.products.forEach((product) => {
      product.pays.forEach((member) => {
        const priceSoFar = this.needToPay.get(member) || 0;
        this.needToPay.set(
          member,
          priceSoFar + product.price / product.pays.length
        );
      });
    });
  }

  deleteReceipt() {
    const deleteDialogRef = this.deleteDialog.open(DialogComponent, {
      disableClose: true,
      data: {
        title: 'Figyelem! A nyugta véglegesen törlődik.',
        button: 'Mégsem',
        submitButton: 'Ok',
      },
    });

    this.submitSubscription =
      deleteDialogRef.componentInstance.submitEvent.subscribe(() => {
        if (this.receipt?.id) {
          this.receiptService.delete(this.receipt.id);
          this.router.navigateByUrl('/receipt/list');
        }
      });
  }

  editReceipt() {
    if (this.receipt?.id) {
      this.router.navigateByUrl(`/receipt/edit/${this.receipt.id}`);
    }
  }

  downloadReceipt() {
    let members: Object[] = [];
    this.tableData.data.forEach((data) => {
      members.push({
        név: data.name,
        fizet: data.pays,
      });
    });

    let downloadData = {
      bolt: this.receipt?.store,
      dátum: this.receipt?.formattedDate,
      pénznem: this.receipt?.currency.symbol,
      végösszeg: this.receipt?.sum,
      tagok: members,
    };

    const json = JSON.stringify(downloadData);
    const uri =
      'data:application/json;charset=UTF-8,' + encodeURIComponent(json);

    this.download.nativeElement.download = `${downloadData.bolt}_${downloadData.dátum}.json`;
    this.download.nativeElement.href = uri;
    this.download?.nativeElement.click();
  }
}
