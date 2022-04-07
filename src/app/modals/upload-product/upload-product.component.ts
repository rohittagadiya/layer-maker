import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-upload-product',
  templateUrl: './upload-product.component.html',
  styleUrls: ['./upload-product.component.scss']
})
export class UploadProductComponent implements OnInit {

  productHeight:any = 0;
  productWidth:any = 0;
  productType:any = 'corner';

  constructor(public modalRef: NgbActiveModal) { }

  ngOnInit(): void {
  }

  selectOption(target){
    console.log(target.value);
    this.productType = target.value;

  }

  submit(){
    if (this.productHeight == 0) {
      alert("Please add product height")
      return
    }else if (this.productWidth == 0) {
      alert("Please add product width")
      return
    }
    this.modalRef.close({height: this.productHeight, width:this.productWidth, type:this.productType})
  }

}
