import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  public apiurl: any = 'http://localhost/layer-maker/public/api/';

  constructor(public http: HttpClient, private router: Router) { }

  getData(q, object, t): Promise<any> {
    let httpOptions: any = {
      headers: {
        'Authorization': "Bearer " + t
      }
    };
    return this.http.post(this.apiurl + q, object, httpOptions).toPromise().then(results => {
      let tmp_results: any = results;
      if (typeof results == 'undefined' || results == null) {
        return ({
          cause: "",
          code: 499,
          data: {},
          message: 'Request is abborted.'
        })
      }
      else {
        return tmp_results;
      }
    }, error => {
      console.log(error);
      return error;
    }).catch(error => {
      console.log(error);
      return error;
    })
  }

  getData1(q, t): Promise<any> {
    let httpOptions: any = {
      headers: {
        'Authorization': "Bearer " + t
      }
    };
    return this.http.get(this.apiurl + q, httpOptions).toPromise().then(results => {
      let tmp_results: any = results;
      if (typeof results == 'undefined' || results == null) {
        return ({
          cause: "",
          code: 499,
          data: {},
          message: 'Request is aborted.'
        })
      }

      else {
        return tmp_results;
      }
      // }
    }, error => {
      console.log(error);
      return error;
    }).catch(error => {
      console.log(error);
      return error;
    });
  }
}
