import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { PersistenceService } from 'angular-persistence';
import { BizagiService } from 'src/app/services/bizagi/bizagi.service';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { Credit } from 'src/app/shared/model/credit';
import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { Notification } from 'src/app/shared/model/Notification';
import { AlertController, Platform } from '@ionic/angular';
import { CobisService } from 'src/app/services/cobis/cobis.service';
import { IdentidadPersona } from 'src/app/shared/model/IdentidadPersona';
import { MensajeSMS } from 'src/app/shared/model/MensajeSMS';
import { CreditSMS } from 'src/app/shared/model/CreditSMS';
import { ImplementsPage } from '../implements/implements.page';
import { ProductiveUnitPage } from '../productive-unit/productive-unit.page';
import { ActividadPage } from '../actividad/actividad.page';
import { FormBuilder } from '@angular/forms';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { DateAdapter } from '@angular/material/core';
import { RubroService } from 'src/app/services/rubro/rubro.service';
import { InfraestructurePage } from '../infraestructure/infraestructure.page';
import { Parametro } from 'src/app/shared/model/parametro';
import { Catalogs } from 'src/app/shared/core/constants/catalog.enum';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-credits',
  templateUrl: './credits.page.html',
  styleUrls: ['./credits.page.scss'],
})
export class CreditsPage implements OnInit {
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;
  creditsUser: Array<Credit>;
  obligacionesRequiresInternet = false;
  rubroCompleto = false;
  listIdCase = Array<any>();
  mensajeAlerta = '';
  mensajeSinConexion = '';
  celular = '';
  obligacionCredits: string;
  creditsNotification: Array<Credit>;
  implementsPage: ImplementsPage;
  productiveUnitPage: ProductiveUnitPage;
  activityPage: ActividadPage;
  infrastructurePage: InfraestructurePage;
  dataBaseOffline = new DatabaseComponent(this.sqlite, this.persistenceService);

  tiposDocumento: Array<Parametro>;

  constructor(private readonly resourceService: ResourceService,
              private readonly router: Router,
              private readonly bizagiService: BizagiService,
              private readonly cobis: CobisService,
              private readonly persistenceService: PersistenceService,
              private sqlite: SQLite,
              private readonly persistence: PersistenceService,
              private readonly alertController: AlertController,
              private readonly toasterService: ToasterService,
              private readonly formBuilder: FormBuilder,
              private readonly parametroService: ParametroService,
              private readonly rubroService: RubroService,
              private readonly dateAdapter: DateAdapter<Date>,
              private readonly loadingService: LoadingService,
              private platform: Platform
  ) {
    this.listIdCase = new Array<any>();
    this.creditsNotification = new Array<Credit>();
    this.obligacionCredits = '';
    this.implementsPage = new ImplementsPage(alertController,
      formBuilder, parametroService, persistenceService,
      resourceService, router, rubroService,
      toasterService, sqlite,loadingService);
    this.infrastructurePage = new InfraestructurePage(
      resourceService, router, toasterService, formBuilder,
      alertController, parametroService, persistenceService,
      rubroService, dateAdapter, sqlite, loadingService);
    this.productiveUnitPage = new ProductiveUnitPage(alertController,
      formBuilder, parametroService, persistenceService, resourceService, router,
      rubroService, toasterService, sqlite, loadingService);
    this.activityPage = new ActividadPage(resourceService,
      router, toasterService,
      formBuilder, alertController,
      parametroService, persistenceService,
      persistenceService, sqlite, loadingService);


    document.addEventListener('backbutton', () => {
        if (this.router.url === '/productive-unit') {
          this.resourceService.ClearPersistenceKey('ListaActividad');
        }
    });

    this.tiposDocumento = new Array<Parametro>();
  }

  ngOnInit() {
    this.executeParameterFunctions();
  }

  ionViewWillEnter() {
    this.executeParameterFunctions();
  }

  executeParameterFunctions() {
    if (this.resourceService.IsOnline()) {
      this.searchParametro();
      this.GetCredits();
      this.CheckCatalogs();
    } else {
      if (this.resourceService.IsDevice()) {
        this.tipoDocOffline();
        this.GetCreditsOffline();
      }
    }
  }

  GetCredits() {
    this.resourceService.ClearPersistenceKey('ListaActividad');
    const user = this.resourceService.GetUser();
    if (user !== undefined) {
      this.bizagiService.GetCredits(user.usuario, user.tipoIdentificacion).subscribe(
        async (res: HttpResponse<Credit>) => {
          if (res.responseMessage !== null && res.responseMessage.includes('obligaciones asignadas')) {
            this.creditsUser = [];
            this.toasterService.PresentToastMessage(res.responseMessage);
          } else {
            this.resourceService.SetPersistenceValue('credits', JSON.stringify(res.resultData));
            if (this.resourceService.IsDevice()) {
              // Inserta informacion de obligaciones en la tabla obligaciones sqlite
              await this.InsertarObligacionesAsociadas(res.resultData);
            }
            this.creditsNotification = res.resultData;
            this.FilterCredits(res.resultData);
            if (res.responseMessage != null) {
              if (res.responseMessage.includes('Codigo de Rubro')) {
                this.toasterService.PresentToastMessage(res.responseMessage);
              }
            }
            this.GetCreditsForNotification(res.resultData);
          }
        }
      );
    }
  }

  GetCreditsForNotification(res) {
    const groups = res.reduce((obj, item) => {
      (obj[item.idCase] = obj[item.idCase] || []).push(item);
      return obj;
    }, {});
    const data = Object.keys(groups).map((key) => {
      return { idCase: key, data: groups[key] };
    });
    this.listIdCase = data;
  }

  async SendNotification(obligacion: number) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Confirmación',
      message: '<strong>¿Esta seguro que desea enviar para revisión los formularios cargados?</strong>',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.MostrarMensaje('Valide la información cargada y recuerde enviarla nuevamente');
          },
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.SendNotificationService(obligacion);
          },
        },
      ],
    });
    await alert.present();
  }

  async tipoDocOffline() {
    this.tiposDocumento = await this.dataBaseOffline.selectDataParametro(Catalogs.TipoDocumento);
  }

  async searchParametro() {
    const tipoDoc = this.parametroService.ConsultarParametro(Catalogs.TipoDocumento);

    await forkJoin([tipoDoc]).subscribe(
        (res) => {
          this.tiposDocumento = res[0].resultData;
          this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
          this.dataBaseOffline.deleteDataParametro(Catalogs.TipoDocumento);
          for (const tipoDocumento of this.tiposDocumento) {
            this.dataBaseOffline.insertDataParametro(tipoDocumento, Catalogs.TipoDocumento);
          }
      }
    );
  }

  SendNotificationService(obligacion: number) {
    const notificacion = new Notification();
    if (this.resourceService.IsOnline()) {
      notificacion.codigoObligacion = `${obligacion}`;
      for (let i = 0; i < this.listIdCase.length; i++) {
        if (this.listIdCase[i].data[0].obligacion === obligacion) {
          notificacion.idCase = Number(this.listIdCase[i].idCase);
          this.bizagiService.SendNotification(notificacion).subscribe(
            async (res) => {
              if (res.responseMessage === null && res.resultData[0] === true) {
                this.mensajeAlerta = 'Notificación enviada exitosamente';
                this.GetDataForNotification(obligacion);
                this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
                this.databaseComponent.DeleteDataObligacion(obligacion);
                this.GetCredits();
              } else {
                this.mensajeAlerta = res.responseMessage.substring(0, res.responseMessage.length - 2);
              }
              for (let i = 0; i < this.creditsNotification.length; i++) {
                this.obligacionCredits = this.creditsNotification[i].obligacion;
                if (Number(this.obligacionCredits) === obligacion) {
                  this.creditsNotification[i].mensajeValidacionNotificacion = this.mensajeAlerta;
                }
              }
              this.FilterCredits(this.creditsNotification);
            }
          );
        }
      }
    } else {
      this.MostrarMensaje('Señor usuario recuerde que para el envió de su autogestión, debe estar conectado a internet');

    }
  }

  SendNotificationSMS(celular, obligacion) {
    const datosNotificacion = new MensajeSMS();
    const datosCredit = new CreditSMS();
    datosNotificacion.valDestinatario = celular;
    datosNotificacion.valTexto = 'Banco Agrario informa que los soportes de su inversión fueron remitidos con éxito y la información será validada.';
    datosCredit.mensajeSMS = datosNotificacion;
    this.bizagiService.SendNotificationSMS(datosCredit).subscribe(
      (res) => {
        if (res.resultData[0] === false) {
          for (let i = 0; i < this.creditsNotification.length; i++) {
            this.obligacionCredits = this.creditsNotification[i].obligacion;
            if (Number(this.obligacionCredits) === Number(obligacion)) {
              this.creditsNotification[i].mensajeValidacionNotificacion = 'Se ha producido un error con el envío de los soportes de su inversión, por favor intente más tarde';
            }
          }
          this.FilterCredits(this.creditsNotification);
          this.GetCredits();
        }
        else{
          this.GetCredits();
      }
    }
    );

  }

  GetDataForNotification(obligacion) {
    const identidadPersona = new IdentidadPersona();
    const user = this.resourceService.GetUser();
    identidadPersona.valIdentidadPersona = user.usuario;
    identidadPersona.codTipoIdentidadPersona = user.tipoIdentificacion;
    this.persistence.set('mostrarAutorizaciones',false);
    this.cobis.ConsultarClienteCobis(identidadPersona).subscribe(
      res => {
        this.persistence.set('sinRespuestaServicio',false);
        this.SendNotificationSMS(res.resultData[0].celular, obligacion);
      }
    );
  }

  async MostrarMensaje(mensaje: string) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor',
      header: 'Información',
      message: '<strong>' + mensaje + '</strong>',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
          },
        },
      ],
    });
    await alert.present();
  }

  FilterCredits(items: Array<Credit>) {
    const lookup = {};
    const result = [];
    const rubros = [];
    for (let item, i = 0; item = items[i++];) {
      const obj = new Credit();
      const name = item.obligacion;
      const rubroCompleto = item.rubroCompleto;
      if (!(name in lookup)) {
        lookup[name] = 1;
        obj.obligacion = name;
        obj.fechaLimiteAutogestion = item.fechaLimiteAutogestion;
        obj.fechaDesembolso = item.fechaDesembolso;
        obj.descripcionRubro = item.descripcionRubro;
        obj.mensajeValidacionNotificacion = item.mensajeValidacionNotificacion;
        if (rubroCompleto) {
          obj.rubroCompleto = true;
        } else {
          obj.rubroCompleto = false;
        }
        result.push(obj);
      }
    }
    this.creditsUser = result;
  }

  CheckHeading(credit: Credit) {
    this.resourceService.SetPersistenceValue('obligacion', credit.obligacion);
    this.router.navigate(['/rubro'], { state : this.tiposDocumento });
  }

  home() {
    this.router.navigate(['/home']);
  }

  async InsertarObligacionesAsociadas(obligaciones) {
    const login = JSON.parse(this.persistenceService.get('user'));
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    // Borrar obligaciones
    await this.databaseComponent.deleteDataObligaciones(login.usuario);
    // Insertar obligaciones
    for (const obligacion of obligaciones) {
      await this.databaseComponent.insertDataObligaciones(login.usuario, obligacion);
    }
    // Datos almacenados de obligaciones
    const datos = await this.databaseComponent.selectDataObligaciones(login.usuario);
  }

  async GetCreditsOffline() {
    if (this.persistence.get('user') !== undefined) {
      const login = this.persistence.get('user');
      // Obtiene las obligaciones del usuario
      let obligacion;
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      if ( typeof login === 'string'){
        obligacion = await this.databaseComponent.selectDataObligaciones(JSON.parse(login).usuario);
      }
      else{
        obligacion = await this.databaseComponent.selectDataObligaciones(login.usuario);
      }
      this.FilterCredits(obligacion);
      if (this.creditsUser.length === 0) {
        this.obligacionesRequiresInternet = true;
      }
      this.resourceService.SetPersistenceValue('credits', JSON.stringify(obligacion));
    }
  }

  async CheckCatalogs() {
    await this.infrastructurePage.GetCatalogs();
    await this.implementsPage.CatalogosCantidadFotos();
    await this.productiveUnitPage.ConsultarParametroActividad();
    await this.productiveUnitPage.CatalogosCantidadFotos();
    await this.activityPage.ConsultarCatalogos();
  }
}
