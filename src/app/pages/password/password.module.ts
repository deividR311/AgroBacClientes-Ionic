import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PasswordPageRoutingModule } from './password-routing.module';
import { PasswordPage } from './password.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    PasswordPageRoutingModule,
    TranslateModule
  ],
  declarations: [PasswordPage]
})
export class PasswordPageModule {}
