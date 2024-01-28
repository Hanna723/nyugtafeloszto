import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { Currency } from 'src/app/shared/models/Currency';
import { Group } from 'src/app/shared/models/Group';
import { Member } from 'src/app/shared/models/Member';
import { CurrencyService } from 'src/app/shared/services/currency.service';
import { GroupService } from 'src/app/shared/services/group.service';
import { MemberService } from 'src/app/shared/services/member.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteActivatedEvent } from '@angular/material/autocomplete';
import { Receipt } from 'src/app/shared/models/Receipt';
import { Product } from 'src/app/shared/models/Product';
import { ReceiptService } from 'src/app/shared/services/receipt.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit {
  @ViewChild('currencyInput') currencyInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('payerInput') payerInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  id?: string;
  uid?: string;
  receiptForm: FormGroup = new FormGroup({
    store: new FormControl(''),
    date: new FormControl(''),
    currency: new FormControl(''),
    products: this.formBuilder.array([]),
  });

  currencies?: Array<Currency>;
  filteredCurrencies?: Array<Currency>;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  membersAndGroups?: Array<Member | Group>;
  filteredMembersAndGroups?: Array<Member | Group>;
  fetchedMembers?: Array<Member>;

  constructor(
    private formBuilder: FormBuilder,
    private currencyService: CurrencyService,
    private memberService: MemberService,
    private groupService: GroupService,
    private receiptService: ReceiptService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (!user) {
      return;
    }
    this.uid = JSON.parse(user).uid;
    this.id = this.route.snapshot.params['id'];

    this.currencyService.getAll().subscribe((data) => {
      this.currencies = [...data];
      this.filteredCurrencies = [...data];
    });

    if (this.uid) {
      this.memberService.getAllForOneUser(this.uid).subscribe((data) => {
        if (this.uid) {
          this.groupService
            .getAllForOneUser(this.uid)
            .subscribe((groupData) => {
              this.membersAndGroups = [...data, ...groupData];
              this.fetchedMembers = [...data];
              this.filteredMembersAndGroups = [...data, ...groupData];
            });
        }
      });
    }

    if (this.id) {
      this.setExistingReceiptData();
    }
  }

  setExistingReceiptData(): void {
    if (!this.id || !this.uid) {
      return;
    }
    this.receiptService.getById(this.id, this.uid).subscribe((data) => {
      this.receiptForm.controls['store'].setValue(data?.store);
      this.receiptForm.controls['date'].setValue(data?.date.toDate());
      if (data?.currency) {
        this.currencyService
          .getById(data.currency as unknown as string)
          .subscribe((currency) => {
            this.receiptForm.controls['currency'].setValue(currency);
          });
      }

      const products = <FormArray>this.receiptForm.controls['products'];
      data?.products.forEach((product) => {
        products.push(
          this.formBuilder.group({
            name: new FormControl(product.name),
            piece: new FormControl(product.piece),
            price: new FormControl(product.price),
            pays: this.formBuilder.array(product.pays),
          })
        );
      });
    });
  }

  filter(): void {
    const filterValue = this.currencyInput.nativeElement.value.toLowerCase();
    this.filteredCurrencies = this.currencies?.filter(
      (currency) =>
        currency.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        currency.symbol.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  trackOption(index: number, option: Currency) {
    return option.name;
  }

  displayCurrency(currency: Currency): string {
    if (!currency) {
      return '';
    }
    return `${currency.name} (${currency.symbol})`;
  }

  getProducts() {
    return (this.receiptForm.get('products') as FormArray).controls;
  }

  addProduct(): void {
    const products = this.receiptForm.get('products') as FormArray;
    products.push(
      this.formBuilder.group({
        name: new FormControl(''),
        piece: new FormControl(''),
        price: new FormControl(''),
        pays: this.formBuilder.array([]),
      })
    );
  }

  removeProduct(i: number): void {
    const products = this.receiptForm.get('products') as FormArray;
    products.removeAt(i);
  }

  getPayersFormArray(i: number): FormArray | null {
    const products = this.receiptForm.get('products') as FormArray;
    const product = products.at(i) as FormGroup;
    const productArray = product.get('pays') as FormArray;

    if (this.id) {
      productArray.controls.forEach((control) => {
        if (typeof control.value === 'string' && this.uid) {
          this.memberService
            .getById(control.value, this.uid)
            .subscribe((member) => {
              control.setValue(member);
            });
        }
      });
    }

    return productArray;
  }

  addPayer(event: MatChipInputEvent, i: number): void {
    const value = (event.value || '').trim();

    if (value) {
      const selected = this.filteredMembersAndGroups?.at(0);

      if (selected) {
        let control = new FormControl<Member | Group>(selected);
        this.getPayersFormArray(i)?.push(control);
        this.filteredMembersAndGroups = this.membersAndGroups;
      }
    }

    event.chipInput!.clear();
  }

  removePayer(i: number, j: number) {
    const payers = this.getPayersFormArray(i);

    if (payers && j >= 0 && j < payers?.length) {
      payers.removeAt(j);
    }
  }

  selectedPayer(event: MatAutocompleteActivatedEvent, i: number): void {
    let control = new FormControl<Member | Group>(event.option?.value);
    this.getPayersFormArray(i)?.push(control);
    this.payerInputs.toArray()[i].nativeElement.value = '';
  }

  filterPayer(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value.toLowerCase();

    this.filteredMembersAndGroups = this.membersAndGroups?.filter((el) =>
      el.name.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  trackPayer(index: number, option: Member | Group) {
    return option.name;
  }

  onSubmit() {
    const user = localStorage.getItem('user');
    if (!user) {
      return;
    }
    const uid = JSON.parse(user).uid;

    let sum = 0;
    let products: Product[] = [];
    let members: Set<string> = new Set();
    const productArray = this.receiptForm.controls['products'] as FormArray;

    productArray.controls.forEach((productControl) => {
      let productGroup = productControl as FormGroup;
      let pays: Set<string> = new Set();

      productGroup.controls['pays'].value.forEach((el: Member | Group) => {
        if (el.id) {
          if ('members' in el) {
            el.members.forEach((member) => {
              pays.add(member);
              members.add(member);
            });
          } else {
            pays.add(el.id);
            members.add(el.id);
          }
        }
      });

      const product: Product = {
        name: productGroup.controls['name'].value,
        piece: productGroup.controls['piece'].value,
        price: productGroup.controls['price'].value,
        pays: Array.from(pays),
      };

      products.push(product);
      sum += product.price;
    });

    const receipt: Receipt = {
      user: uid,
      store: this.receiptForm.controls['store'].value,
      date: this.receiptForm.controls['date'].value,
      currency: this.receiptForm.controls['currency'].value.id,
      sum: sum,
      products: products,
      members: Array.from(members),
    };

    if (this.id) {
      receipt.id = this.id;
      this.receiptService.update(receipt);
    } else {
      this.id = this.receiptService.create(receipt);
    }
    this.router.navigateByUrl(`/receipt/${this.id}`);
  }
}
