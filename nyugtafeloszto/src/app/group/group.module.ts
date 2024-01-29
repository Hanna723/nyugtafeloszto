import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';

import { ListComponent } from './list/list.component';
import { GroupRoutingModule } from './group-routing.module';
import { PreviewComponent } from './preview/preview.component';
import { EditComponent } from './edit/edit.component';

@NgModule({
  declarations: [ListComponent, PreviewComponent, EditComponent],
  imports: [
    CommonModule,
    GroupRoutingModule,
    MatListModule,
    MatTableModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule
  ],
})
export class GroupModule {}
