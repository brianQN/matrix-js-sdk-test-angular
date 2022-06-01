import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatrixUserManagementService {

  constructor() { }

  /* General */

  private static getAccessToken(username:string, password:string): Promise<string>{
    const body = {
      "type": "m.login.password",
      "user": username,
      "password": password
    };
    const url = environment.matrixServerBaseUrl.concat("/_matrix/client/r0/login");

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.postData(url, body).then(
        (res:any)=>{
          resolve(res.access_token);
        },
        (err:any)=>{
          reject(err);
        }
      )
    });
  }

  private static getAdminAccessToken(): Promise<string>{
    return MatrixUserManagementService.getAccessToken(environment.adminMatrixAccount.username, environment.adminMatrixAccount.password);
  }

  /* Registration */
  public static createNewRegistrationToken(): Promise<any>{
    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (adminAccessToken: string) =>{

          const url: string = environment.matrixServerBaseUrl.concat("/_synapse/admin/v1/registration_tokens/new?access_token=", adminAccessToken);
          MatrixUserManagementService.postData(url, {}).then(

            (createRegistrationTokenRes: any)=>{
              resolve(createRegistrationTokenRes);
            },
            (createRegistrationTokenErr: any)=>{
              reject("Failed while creating Registration-Token: " + createRegistrationTokenErr);
            },
          )
        },
        (adminAccessTokenErr: any) =>{
          reject("Failed while getting Admin-Acces-Token: " + adminAccessTokenErr);
        }
      )
    });
  }

  public static getRegistrationTokens(): Promise<any>{
    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (adminAccessToken: string) =>{

          const url: string = environment.matrixServerBaseUrl.concat("/_synapse/admin/v1/registration_tokens?access_token=", adminAccessToken);
          MatrixUserManagementService.getData(url).then(
            (regTokensRes: any) =>{
              console.log(regTokensRes);
              resolve(regTokensRes.registration_tokens);
            },
            (regTokensErr: string) =>{
              reject("Error while getting regTokens "+ regTokensErr)
            },
          )   

        },
        (adminAccessTokenErr: any) =>{
          reject("Failed while getting Admin-Acces-Token: " + adminAccessTokenErr);
        }
      )
    });
  }
 
  public async createNewUser(username: string, password: string): Promise<any>{
    
    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getRegistrationTokens().then(
        (registerTokensRes: any) => {

          const registerAccessToken = registerTokensRes[0];
          const registrationRequestUrl = environment.matrixServerBaseUrl.concat("/_matrix/client/r0/register");
          const registrationRequestData = {
            "auth": {
              "type": "m.login.registration_token",
              "token": registerAccessToken,
              "session": "xxxxx"
            },
            "device_id": "ABC",
            "initial_device_display_name": "Studytalk-Registration",
            "password": password,
            "username": username
          }
          MatrixUserManagementService.postData(registrationRequestUrl, registrationRequestData).then(
            (registerRes: any)=>{
              resolve(registerRes);
            },
            (registerErr: string) => {
              console.log("Error while registering new User " + registerErr);
            }
          )

        },
        (registerTokensErr: string) => {
          console.log("Error while getting Register Tokens " + registerTokensErr);
        }
      )
    });
  }

  /* Reset Password */
  public static changePassword(username: string, newPassword: string): Promise<any> {
    const userId: string = "@".concat(username,":studytalk.inform.hs-hannover.de")

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (adminAccessToken: string) =>{
          const url: string = environment.matrixServerBaseUrl.concat("/_synapse/admin/v1/reset_password/", userId, "?access_token=", adminAccessToken);
          const data = {
            "new_password": newPassword,
            "logout_devices": true
          };
          MatrixUserManagementService.postData(url, data).then(
            (changePwRes: any) =>{
              resolve(changePwRes);
            },
            (changePwErr: string) =>{
              reject("Error while changing password of user "+ username + " : "+ changePwErr)
            },
          )   

        },
        (adminAccessTokenErr: any) =>{
          reject("Failed while getting Admin-Acces-Token: " + adminAccessTokenErr);
        }
      )
    });
  }

  /* Delete User */

  public static deactivateUser(username:string): Promise<any>{
    const userId: string = "@".concat(username,":studytalk.inform.hs-hannover.de")

    return new Promise(function(resolve, reject){
      MatrixUserManagementService.getAdminAccessToken().then(
        (adminAccessToken: string) =>{
          const url: string = environment.matrixServerBaseUrl.concat("/_synapse/admin/v1/deactivate/", userId, "?access_token=", adminAccessToken);
          const data = {
            "erase": true
          };
          MatrixUserManagementService.postData(url, data).then(
            (deactivateRes: any) =>{
              resolve(deactivateRes);
            },
            (deactivateErr: string) =>{
              reject("Error while deactivating user "+ username + " : "+ deactivateErr)
            },
          )   

        },
        (adminAccessTokenErr: any) =>{
          reject("Failed while getting Admin-Acces-Token: " + adminAccessTokenErr);
        }
      )
    });
  }

  /* Fetch-Helpers */
  private static getData(url: string): Promise<any>{
    return new Promise(function(resolve, reject){
      let response = fetch(url);
      response.then(
        (fetchRes: any) => {
          fetchRes.json().then(
            (jsonRes: any) =>{
              resolve(jsonRes);
            },
            (jsonErr: any)=>{
              reject("Error while fetching json: " + jsonErr);
            }
          )
        },
        (fetchErr: string) => {
          reject("Error during fetch: " + fetchErr)
        }
      )
    });
  }
  private static postData(url:string, data:any): Promise<any>{

    return new Promise(function(resolve, reject){
      let response = fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json"
        }
    });
      

      response.then(
        (fetchRes: any) => {
          fetchRes.json().then(
            (jsonRes: any) =>{
              resolve(jsonRes);
            },
            (jsonErr: any)=>{
              reject("Error while fetching json: " + jsonErr);
            }
          )
        },
        (fetchErr: any) => {
          reject("Error during fetch: " + fetchErr)
        }
      )
    });
  }
}
