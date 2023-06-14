import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreditsPageRoutingModule } from './credits-routing.module';

import { CreditsPage } from './credits.page';
import { TranslateModule } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CoreModule } from 'src/app/shared/core/core.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreditsPageRoutingModule,
    TranslateModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CoreModule
  ],
  providers: [
    MatNativeDateModule
  ],
  declarations: [CreditsPage]
})
export class CreditsPageModule {}
