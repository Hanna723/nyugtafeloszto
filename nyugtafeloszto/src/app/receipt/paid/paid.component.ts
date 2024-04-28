import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Member } from 'src/app/shared/models/Member';

@Component({
  selector: 'app-paid',
  templateUrl: './paid.component.html',
  styleUrls: ['./paid.component.scss'],
})
export class PaidComponent implements OnInit {
  @Output() submitEvent = new EventEmitter();
  paidForm: FormGroup = new FormGroup({
    paid: this.formBuilder.array([]),
  });

  constructor(
    public dialogRef: MatDialogRef<PaidComponent>,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const paid = this.paidForm.controls['paid'] as FormArray;

    this.data.members.forEach((member: Member) => {
      paid.push(new FormControl(member.paid, [Validators.pattern('^[0-9]*$')]));
    });
  }

  getPaidAmount() {
    return (this.paidForm.get('paid') as FormArray).controls;
  }

  getPaidAmountAt(i: number) {
    return this.getPaidAmount().at(i) as FormControl;
  }

  onSubmit() {
    for (let i = 0; i < this.data.members.length; i++) {
      this.data.members[i].paid = this.getPaidAmountAt(i).value;
    }

    this.submitEvent.emit(this.data.members);
    this.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}
