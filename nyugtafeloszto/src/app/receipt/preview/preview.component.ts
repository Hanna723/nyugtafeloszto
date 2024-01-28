import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
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
export class PreviewComponent implements OnInit {
  user?: string | null;
  receipt?: Receipt;
  needToPay: Map<string, number> = new Map();
  members: Array<Member> = [];
  columnsToDisplay = ['name', 'pays'];

  constructor(
    private receiptService: ReceiptService,
    private memberService: MemberService,
    private currencyService: CurrencyService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private router: Router,
    public deleteDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');
    const id = this.route.snapshot.params['id'];

    if (this.user && id) {
      this.receiptService.getById(id, this.user).subscribe((data) => {
        this.receipt = data;
        this.currencyService
          .getById(data?.currency as unknown as string)
          .subscribe((currency) => {
            let date = data?.date.toDate();
            if (currency && data) {
              data.currency = currency;
              data.formattedDate = this.datePipe.transform(
                date,
                'yyyy. MM. dd.'
              );
            }
          });
        this.calculatePrices();
        this.getMembersFromReceipt();
      });
    } else {
      this.router.navigateByUrl('/receipt/list');
    }
  }

  getMembersFromReceipt() {
    this.receipt?.members.forEach((memberId) => {
      if (this.user) {
        this.memberService.getById(memberId, this.user).subscribe((member) => {
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

    deleteDialogRef.componentInstance.submitEvent.subscribe(() => {
      if (this.receipt?.id) {
        this.receiptService.delete(this.receipt.id);
        this.router.navigateByUrl('/receipt/list');
      }
    });
  }

  editReceipt() {}
}
