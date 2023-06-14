import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RubroPageRoutingModule } from './rubro-routing.module';

import { RubroPage } from './rubro.page';
import { TranslateModule } from '@ngx-translate/core';
import { CoreModule } from 'src/app/shared/core/core.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RubroPageRoutingModule,
    TranslateModule,
    CoreModule
  ],
  declarations: [RubroPage]
})
export class RubroPageModule {}
