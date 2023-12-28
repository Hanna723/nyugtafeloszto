import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Group } from 'src/app/shared/models/Group';
import { GroupService } from 'src/app/shared/services/group.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {
  tableData?: Array<Group>;
  columnsToDisplay = ['name'];
  groupForm: FormGroup = new FormGroup({
    name: new FormControl(''),
  });

  constructor(private groupService: GroupService) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');

    if (user) {
      this.groupService
        .getAllForOneUser(JSON.parse(user).uid)
        .subscribe((data) => {
          this.tableData = [];
          data.forEach((el) => {
            this.tableData?.push(el);
          });
        });
    }
  }

  onSubmit() {
    const user = localStorage.getItem('user');

    if (!user) {
      return;
    }
    // const group: Group = {
    //   user: JSON.parse(user).uid,
    //   name: this.memberForm.controls['name'].value
    // }
    // this.memberService.create(member);
    // this.memberForm.controls['name'].setValue('');
  }
}
