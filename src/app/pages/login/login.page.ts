import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/services/login/login.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { HttpResponse } from 'src/app/shared/model/httpresponse';
import { Login } from 'src/app/shared/model/login';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ValidatePassword } from 'src/app/shared/core/password.validator';
import { PersistenceService } from 'angular-persistence';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  loginFormGroup: FormGroup;
  loginLocal = new Array<Login>();
  estadoNotificacionAcceso = false;
  constructor(private readonly formBuilder: FormBuilder,
              private readonly router: Router,
              private readonly loginService: LoginService,
              private readonly toaster: ToasterService,
              private readonly persistence: PersistenceService,
              private readonly resourceService: ResourceService) {
                this.loginLocal = [];
                this.persistence.set('login',  false);
  }

  ngOnInit() {
    this.InitializeForm();
  }

  ionViewWillEnter(){
    this.InitializeForm();
  }

  InitializeForm(){
    this.loginFormGroup = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.maxLength(12)]],
      userPassword: ['', [Validators.required, Validators.pattern('[0-9]{5,8}'), Validators.minLength(5),
      Validators.maxLength(8), ValidatePassword()]]
    });
  }


  OnSubmit() {
    if (!this.loginFormGroup.valid) {
      return;
    }
    this.Login();
    this.ClearForm();
  }

  Login(){
    const login: Login = new Login();
    login.usuario = this.loginFormGroup.controls.userName.value;
    login.contrasena = this.loginFormGroup.controls.userPassword.value;
    login.estadoNotificacionAcceso = this.estadoNotificacionAcceso;

    if (this.resourceService.IsOnline()) {
      // Consumo de servicio de login
      this.loginServiceMetodo(login);
    } else {
      this.offlineLogin(login);
    }
  }

  offlineLogin(login: Login) {
    const insertarLocalStorage = this.validarUsuario(login);
    if (!insertarLocalStorage) {
      this.persistence.set('user', login);
      this.persistence.set('login',  true);
      this.resourceService.SetPersistenceValue('user', login);
      this.router.navigate(['/principal']);
    } else {
      this.persistence.set('login',  false);
      this.toaster.PresentToastMessage('Usuario no encontrado');
    }
  }

  SignUp(mostrarAutorizaciones: any){
    this.persistence.set('mostrarAutorizaciones', `${mostrarAutorizaciones}`);
    this.router.navigate(['/register']);
  }

  ClearForm(){
    this.loginFormGroup.controls.userName.reset();
    this.loginFormGroup.controls.userPassword.reset();
    this.estadoNotificacionAcceso = false;
  }

  format(){
    const regular = /[^0-9]*/g;
    let valor = null;
    valor = this.loginFormGroup.value.userPassword;
    if (valor !== null) {
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.loginFormGroup.controls.userPassword.setValue(valor);
      }​​​​​, 10);
    }
  }

  expresionRegular(){
    const regular = /[^a-zA-Z0-9ñÑ\d]/i;
    let valor = null;
    valor = this.loginFormGroup.value.userName;
    if (valor !== null) {
      valor = valor.substring(0, 12);
      valor = valor.replace(regular, '');
      setTimeout(() => {​​​​​
        this.loginFormGroup.controls.userName.setValue(valor);
      }​​​​​, 10);
    }
  }

  guardarLocalStorage(user: { contrasena: string; usuario: string; }, tipoIdentificacion: string) {
    // Guardado en el local storage
    this.loginLocal = [];
    this.loginLocal = JSON.parse(localStorage.getItem('user'));
    if (this.loginLocal === null || this.loginLocal === undefined) {
      this.loginLocal = [];
    }
    const loginUsuarioLocal = new Login();
    loginUsuarioLocal.contrasena = user.contrasena;
    loginUsuarioLocal.usuario = user.usuario;
    loginUsuarioLocal.tipoIdentificacion = tipoIdentificacion;
    this.loginLocal = new Array<Login>();
    this.loginLocal.push(loginUsuarioLocal);
    localStorage.removeItem('user');
    localStorage.setItem('user', JSON.stringify(this.loginLocal));
  }

  validarUsuario(user: { contrasena: { toString: () => string; }; usuario: { toString: () => string; }; }) {
    // validacion si el usuario ya ha ingresado a la aplicacion
    let insertarLocalStorage = true;
    this.loginLocal = JSON.parse(localStorage.getItem('user'));
    if (this.loginLocal !== null && this.loginLocal !== undefined) {
      const usuarioEncontrado = this.loginLocal.find(usuario =>
        usuario.contrasena.toString() === user.contrasena.toString()
        && usuario.usuario.toString() === user.usuario.toString());
      if (usuarioEncontrado !== undefined) {
        insertarLocalStorage = false;
      }
    }
    return insertarLocalStorage;
  }

  loginServiceMetodo(login: Login) {
    this.loginService.Login(login).subscribe(
      (data: HttpResponse<any>) => {
        if (data.responseCode === Enumerator.HTTP_RESPONSE_OK
            && data.resultData.length > 0 && data.resultData[0].error === 'True'){
            this.toaster.PresentToastMessage(data.resultData[0].mensaje);
          }else {
              // Login OK
              this.resourceService.SetPersistenceValue('authorization', data.authorization);
              this.resourceService.SetPersistenceValue('user', JSON.stringify(data.resultData[0]));
              this.persistence.set('login',  true);
              this.estadoNotificacionAcceso = true;
              // Valida si el usuario se encuentra en el local storage
              const insertarLocalStorage = this.validarUsuario(login);
              this.ClearForm();
              if (insertarLocalStorage) {
                // Almacena en el local storage
                this.guardarLocalStorage(login, data.resultData[0].tipoIdentificacion);
              }
              this.router.navigate(['/principal']);
          }
      },
      (err: any) => {
        this.persistence.set('Online', false);
        this.offlineLogin(login);
      }
    );
  }
}
