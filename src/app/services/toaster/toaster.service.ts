import { Injectable } from "@angular/core";
import { ToastController } from "@ionic/angular";
import { Enumerator } from "src/app/shared/enum/enumerator.enum";


@Injectable({
    providedIn: 'root'
})

export class ToasterService {
    constructor(private readonly toastController: ToastController){
    }

    async PresentToastMessage(message: string){
        const toast = await this.toastController.create({
            message: message,
            duration: Enumerator.TOASTER_DURATION_TIME
          });
          toast.present();
    }
}
