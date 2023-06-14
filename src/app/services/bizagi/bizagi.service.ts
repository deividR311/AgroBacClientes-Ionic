import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';
import { Notification } from 'src/app/shared/model/Notification';
import { CreditSMS } from 'src/app/shared/model/CreditSMS';


@Injectable({
    providedIn: 'root'
})
export class BizagiService {
    constructor(private readonly httpClient: HttpClient,
                private readonly resourceService: ResourceService) { }

    GetCredits(id: string, idType: string): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarObligaciones?tipoDocumento=${idType}&documento=${id}`;
        return this.httpClient.get(urlService, { headers });
    }

    SendNotification(objectValue: Notification): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}EnviarNotificacionObligacion`;
        return this.httpClient.post(urlService, objectValue, { headers });
    }

    SendNotificationSMS(objectValue: CreditSMS): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}EnviarNotificacionSMS`;
        return this.httpClient.post(urlService, objectValue, { headers });
    }
}
