import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  BASICSHAPELIST,
  CANVASCONFIGOPTIONS,
  COLORS,
  FONTSLIST,
  OBJECTDEFAULTPROPERTIES,
} from './image.constant';

import { fabric } from 'fabric';
import 'fabric-history';
import jspdf from 'jspdf';
import { HttpService } from '../services/http.service';
import * as $ from 'jquery';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UploadProductComponent } from '../modals/upload-product/upload-product.component';

fabric.Object.prototype.set(OBJECTDEFAULTPROPERTIES);
@Component({
  selector: 'app-layout-maker',
  templateUrl: './layout-maker.component.html',
  styleUrls: ['./layout-maker.component.scss'],
})
export class LayoutMakerComponent implements OnInit {
  public context: any;
  public canvas: any;
  public canvas2: any;
  canvasWidth: number;
  canvasHeight: number;
  resize_canvas_during_paste: boolean = false;
  paste_new_object_below: boolean = false;
  canvasObjectList: any = [];
  productTypes: any = [];
  layerSelected: any;

  canvasConfigOptions = CANVASCONFIGOPTIONS;
  objectPrototypeDefaults = OBJECTDEFAULTPROPERTIES;

  BASICSHAPELIST = BASICSHAPELIST;
  COLORS = COLORS;

  fontList: any = FONTSLIST;

  processKeys: any;

  public props: any = {
    fill: null,
    textBackgroundColor: '#ffffff',
  };

  public IsPropActive: boolean = true;
  public selected: any;
  ThreedData = new FormData();

  search_query: string = 'nature';
  page_number: number = 1;
  allPhotosList: any = [];
  pixalsPhotos: boolean = true;
  myPhotos: boolean = false;

  public textEditor: boolean = false;
  public imageEditor: boolean = false;
  public figureEditor: boolean = false;
  public shapeEditor: boolean = false;

  formData: any = new FormData();
  fileList: any;
  file: any;

  width: any = 0;
  height: any = 0;
  sizeType: any = 'px';

  allformatSizes: any = {
    px: {
      width: 0,
      height: 0,
    },
    in: {
      width: 0,
      height: 0,
    },
    cm: {
      width: 0,
      height: 0,
    },
    mm: {
      width: 0,
      height: 0,
    },
  };

  allProducts: any = [];

  // @ViewChild('AddProductModal', { static: false }) private content;
  @ViewChild('AddProductModal') content: ElementRef;

  constructor(public httpService: HttpService, private modalService: NgbModal) {
    let that = this;
    this.processKeys = function (e: any) {
      if (that.selected) {
        let movementDelta = 5;
        console.log('e.keyCode : ', e.keyCode);
        if (e.keyCode === 46 || e.keyCode === 8) {
          // delete || backspace e.keyCode === 8;
          e.preventDefault();
          that.removeSelected();
        }

        if ((e.ctrlKey || e.metaKey) && e.keyCode === 67) {
          // ctrl + c
          console.log('C');
          e.preventDefault();
          that.clone();
        }

        if (e.keyCode === 27) {
          // ESC
          e.preventDefault();
          that.cleanSelect();
        }

        if (e.keyCode === 38) {
          // UP ARROW
          e.preventDefault();
          that.selected[0].top -= movementDelta;
          that.canvas.renderAll();
        }

        if (e.keyCode === 40) {
          // DOWN ARROW
          e.preventDefault();
          that.selected[0].top += movementDelta;
          that.canvas.renderAll();
        }

        if (e.keyCode === 37) {
          // LEFT ARROW
          e.preventDefault();
          that.selected[0].left -= movementDelta;
          that.canvas.renderAll();
        }

        if (e.keyCode === 39) {
          // RIGHT ARROW
          e.preventDefault();
          that.selected[0].left += movementDelta;
          that.canvas.renderAll();
        }
      }
      if (e.keyCode === 90) {
        // Check pressed button is Z - Ctrl+Z.
        e.preventDefault();
        that.canvas.undo();
      }

      if (e.keyCode === 89) {
        // Check pressed button is Y - Ctrl+Y.
        e.preventDefault();
        that.canvas.redo();
      }

      // if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.keyCode === 86) {
      //   // ctrl + z
      //   e.preventDefault();
      //   pasteImage
      // }
    };
    document.addEventListener('keydown', this.processKeys, false);

    let pasteImage = function (e: any) {
      var items = e.originalEvent.clipboardData.items;

      e.preventDefault();
      e.stopPropagation();

      //Loop through files
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') == -1) continue;
        var file = items[i],
          type = items[i].type;
        var imageData = file.getAsFile();
        var URLobj = window.URL || (window as any).webkitURL;
        var img = new Image();
        img.src = URLobj.createObjectURL(imageData);
        fabric.Image.fromURL(img.src, function (img: any) {
          if (
            that.resize_canvas_during_paste &&
            img.width > that.canvas.width
          ) {
            that.canvas.setWidth(img.width + 100);
            that.canvas.setHeight(img.height + 100);
          }
          that.canvas.add(img);
          that.selectItemAfterAdded(img);
        });
      }
    };
    // $(window).on('paste', pasteImage);

    this.fetchAllProducts();
  }

  ngOnInit() {
    //setup front side canvas
    this.canvas = new fabric.Canvas('canvas', this.canvasConfigOptions);

    this.canvas.on({
      'object:added': (e: any) => {},
      'object:selected': (e: any) => {
        this.selected = e.target;
        console.log(this.selected);
        this.layerSelected = JSON.parse(JSON.stringify(this.selected));
        this.applySelectionOnObj();
      },
      'selection:created': (e: any) => {
        this.selected = e.selected;
        this.layerSelected = JSON.parse(JSON.stringify(this.selected));
        console.log(JSON.parse(JSON.stringify(this.selected[0])));
        this.applySelectionOnObj();
      },
      'selection:cleared': (e: any) => {
        this.selected = null;
      },
      'mouse:move': (e: any) => {},
    });

    this.setCanvasFill('#ffffff');

    setTimeout(() => {
      console.log('this.canvasDimension : ', this.canvasDimension);
      this.drawRuler();
    }, 3000);
  }

  fileChange(event) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: any) => {
        // this.addOneCategory.logo = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
    this.fileList = event.target.files;
    if (this.fileList.length > 0) {
      this.formData.delete('file');
      for (let i = 0; i < this.fileList.length; i++) {
        this.formData.append('file', this.fileList[i]);
        this.addPhoto();
      }
    }
  }

  drawRuler() {
    var grid = 24;
    var width = this.canvas.width;
    var measurementThickness = 60;
    this.canvas.add(
      new fabric.Rect({
        left: 0,
        top: 0,
        fill: '#DDD',
        selectable: false,
        width: measurementThickness,
        height: this.canvas.height,
      })
    );

    this.canvas.add(
      new fabric.Rect({
        left: 0,
        top: 0,
        fill: '#DDD',
        width: this.canvas.width,
        selectable: false,
        height: measurementThickness,
      })
    );

    var tickSize = 10;
    var tickSizeFoot = 40;

    // Drag grid
    var count = 0;
    var footCount = 0;

    for (var i = 0; i < width / grid; i++) {
      var offset = i * grid,
        location1 = offset + measurementThickness,
        isFoot = (i) % 12 === 0 && i !== 0;

      // Grid ------------

      // vertical
      this.canvas.add(
        new fabric.Line([location1, measurementThickness, location1, width], {
          stroke: isFoot ? '#888' : '#ccc',
          selectable: false,
        })
      );

      // horizontal
      this.canvas.add(
        new fabric.Line([measurementThickness, location1, width, location1], {
          stroke: isFoot ? '#888' : '#ccc',
          selectable: false,
        })
      );

      // Ruler ------------

      // left
      this.canvas.add(
        new fabric.Line(
          [
            measurementThickness - tickSize,
            location1,
            measurementThickness,
            location1,
          ],
          { stroke: '#888', selectable: false }
        )
      );
      this.canvas.add(
        new fabric.Text(count + '"', {
          left: measurementThickness - tickSize * 2 - 7,
          top: location1,
          fontSize: 12,
          fontFamily: 'san-serif',
          selectable: false,
        })
      );

      if (isFoot) {
        footCount++;

        this.canvas.add(
          new fabric.Line(
            [
              measurementThickness - tickSizeFoot,
              location1,
              measurementThickness,
              location1,
            ],
            { stroke: '#222', selectable: false }
          )
        );
        this.canvas.add(
          new fabric.Text(footCount + "'", {
            left: measurementThickness - tickSizeFoot - 7,
            top: location1 + 4,
            fontSize: 12,
            fontFamily: 'san-serif',
            selectable: false,
          })
        );
      }

      // top
      this.canvas.add(
        new fabric.Line(
          [
            location1,
            measurementThickness - tickSize,
            location1,
            measurementThickness,
          ],
          { stroke: '#888', selectable: false }
        )
      );
      this.canvas.add(
        new fabric.Text(count + '"', {
          left: location1,
          top: measurementThickness - tickSize * 2 - 4,
          fontSize: 12,
          fontFamily: 'san-serif',
          selectable: false,
        })
      );

      if (isFoot) {
        this.canvas.add(
          new fabric.Line(
            [
              location1,
              measurementThickness - tickSizeFoot,
              location1,
              measurementThickness,
            ],
            { stroke: '#222', selectable: false }
          )
        );
        this.canvas.add(
          new fabric.Text(footCount + "'", {
            left: location1 + 4,
            top: measurementThickness - tickSizeFoot - 7,
            fontSize: 12,
            fontFamily: 'san-serif',
            selectable: false,
          })
        );
      }

      count++;
    }
  }

  clearCanvas() {
    this.canvas.clear();
    this.drawRuler();
  }

  downloadMap() {
    var tp = false;
    // this.canvas.backgroundColor = '#ffffff';
    // don't change multiplyer otherwise gradient color will Disperse.
    this.canvas.renderAll();
    let image = this.canvas.toDataURL({ format: 'jpg', multiplier: 1 });
    // let imagehd = changeDpiDataUrl(image, EXPORT_DPI);
    let image_name = new Date().getTime();
    let pageHeight, pageWidth, margin, canvasHeight, canavsWidth;
    let tmpheight, tmpwidth;
    tmpheight = 500;
    tmpwidth = 500;
    pageHeight = canvasHeight = tmpheight / 300;
    pageWidth = canavsWidth = tmpwidth / 300;
    margin = 0;
    var doc = new jspdf('p', 'in', [pageWidth, pageHeight]);
    doc.addImage(image, 'JPEG', margin, margin, canavsWidth, canvasHeight);
    doc.save(image_name + '.pdf');
  }

  addPhoto() {
    // this.content.show()
    this.modalService
      .open(UploadProductComponent, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => {
          console.log('CLOSED', result);
          if (result?.height) {
            var request_data = {
              height: result.height,
              width: result.width,
              type: result.type,
            };
            this.formData.append('request_data', JSON.stringify(request_data));
            this.httpService
              .getData('addProductByUser', this.formData, '')
              .then(
                (result: any) => {
                  if (result.code == 200) {
                    // this.getCategory();
                    this.fetchAllProducts();
                  } else if (result.code == 201) {
                    // this.utils.hideLoader();
                    // this.utils.sweetAlertError({ title: "", message: result.message, icon: 'error', second: TIMER.LONG });
                  } else {
                    // this.utils.hideLoader();
                    // this.utils.sweetAlertError({ title: "", message: result.message, icon: 'error', second: TIMER.LONG });
                  }
                },
                (err: any) => {
                  // this.utils.hideLoader();
                  // this.utils.sweetAlertError({ title: "", message: ERROR.SERVER_INTERNET_ERR, icon: 'error', second: TIMER.MEDIUM });
                }
              )
              .catch((err: any) => {
                // this.utils.hideLoader();
                // this.utils.sweetAlertError({ title: "", message: ERROR.SERVER_INTERNET_ERR, icon: 'error', second: TIMER.MEDIUM });
              });
          }
          // this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
    // <HTMLElement>document.getElementById("openModalButton").click();
    // $('#AddProductModal').modal('show');
    // }
  }

  fetchAllProducts() {
    this.httpService.getData1('getProducts', {}).then((result: any) => {
      this.allProducts = result.data;
    });
  }

  createCanvas(allformatSizes, sizeType) {
    this.canvas.clear();
    this.canvasWidth = allformatSizes.px.width;
    this.canvasHeight = allformatSizes.px.height;
    this.canvas.setWidth(this.canvasWidth);
    this.canvas.setHeight(this.canvasHeight);
    this.drawRuler();
  }

  async clone(position: string = 'left') {
    console.log('IN FUNCTION');
    let activeObject = this.canvas.getActiveObject();
    // activeGroup = this.canvas.getActiveGroup();
    let cloneobject;
    if (activeObject) {
      cloneobject = fabric.util.object.clone(activeObject);
      console.log(
        'cloneobject : ',
        cloneobject,
        cloneobject.left,
        cloneobject.width,
        cloneobject.top
      );

      let left, top;

      switch (position) {
        case 'left':
          (left = cloneobject.left + cloneobject.width * cloneobject.scaleX),
            (top = cloneobject.top);
          break;
        case 'right':
          (left = cloneobject.left - cloneobject.width * cloneobject.scaleX),
            (top = cloneobject.top);
          break;
        case 'top':
          (left = cloneobject.left),
            (top = cloneobject.top - cloneobject.height * cloneobject.scaleY);
          break;
        case 'bottom':
          (left = cloneobject.left),
            (top = cloneobject.top + cloneobject.height * cloneobject.scaleY);
          break;

        default:
          (left = cloneobject.left + cloneobject.width * cloneobject.scaleX),
            (top = cloneobject.top);
          break;
      }

      // if (this.paste_new_object_below) {
      //   (left = cloneobject.left),
      //     (top = cloneobject.top + cloneobject.height * cloneobject.scaleY);
      // } else {
      //   (left = cloneobject.left + cloneobject.width * cloneobject.scaleX),
      //     (top = cloneobject.top);
      // }

      cloneobject.set({
        left: left,
        top: top,
        // angle: cloneobject.angle
      });
      // cloneobject.left= cloneobject.left + cloneobject.width;
      // cloneobject.top= cloneobject.top;
      this.canvas.add(cloneobject);
      this.rotateObjAfterAdded(cloneobject, cloneobject.angle);
      this.canvas.renderAll.bind(this.canvas);
    }
  }

  rotateObjAfterAdded(object, angle) {
    object.rotate(angle);
    object.setCoords();
    this.canvas.renderAll();
  }

  // convertAllSizeFirst(item) {
  //   switch (item.sizeType) {
  //     case 'px':
  //       this.createCanvas({ 'width': item.width, 'height': item.height, 'display_height': item.height, 'display_width': item.width, 'displaySizeType': item.sizeType }, item.chart_type_index);
  //       break;
  //     case 'cm':
  //       this.createCanvas({ 'width': this.utils.convertCmToPx(item.width), 'height': this.utils.convertCmToPx(item.height), 'display_height': item.height, 'display_width': item.width, 'displaySizeType': item.sizeType }, item.chart_type_index);
  //       break;
  //     case 'in':
  //       this.createCanvas({ 'width': this.utils.convertInToPx(item.width), 'height': this.utils.convertInToPx(item.height), 'display_height': item.height, 'display_width': item.width, 'displaySizeType': item.sizeType }, item.chart_type_index);
  //       break;
  //     case 'mm':
  //       this.createCanvas({ 'width': this.utils.convertMmToPx(item.width), 'height': this.utils.convertMmToPx(item.height), 'display_height': item.height, 'display_width': item.width, 'displaySizeType': item.sizeType }, item.chart_type_index);
  //       break;
  //   }
  // }

  convertAllValue(width, height, current) {
    switch (current) {
      case 'px':
        this.allformatSizes.px.width = width;
        this.allformatSizes.px.height = height;
        this.allformatSizes.cm.width = this.convertPxToCm(width);
        this.allformatSizes.cm.height = this.convertPxToCm(height);
        this.allformatSizes.in.width = this.convertPxToIn(width);
        this.allformatSizes.in.height = this.convertPxToIn(height);
        this.allformatSizes.mm.width = this.convertPxToMm(width);
        this.allformatSizes.mm.height = this.convertPxToMm(height);
        break;
      case 'cm':
        this.allformatSizes.cm.width = width;
        this.allformatSizes.cm.height = height;
        this.allformatSizes.px.width = this.convertCmToPx(width);
        this.allformatSizes.px.height = this.convertCmToPx(height);
        this.allformatSizes.in.width = this.convertCmToIn(width);
        this.allformatSizes.in.height = this.convertCmToIn(height);
        this.allformatSizes.mm.width = this.convertCmToMm(width);
        this.allformatSizes.mm.height = this.convertCmToMm(height);
        break;
      case 'in':
        this.allformatSizes.in.width = width;
        this.allformatSizes.in.height = height;
        this.allformatSizes.px.width = this.convertInToPx(width);
        this.allformatSizes.px.height = this.convertInToPx(height);
        this.allformatSizes.cm.width = this.convertInToCm(width);
        this.allformatSizes.cm.height = this.convertInToCm(height);
        this.allformatSizes.mm.width = this.convertInToMm(width);
        this.allformatSizes.mm.height = this.convertInToMm(height);
        break;
      case 'mm':
        this.allformatSizes.mm.width = width;
        this.allformatSizes.mm.height = height;
        this.allformatSizes.px.width = this.convertMmToPx(width);
        this.allformatSizes.px.height = this.convertMmToPx(height);
        this.allformatSizes.cm.width = this.convertMmToCm(width);
        this.allformatSizes.cm.height = this.convertMmToCm(height);
        this.allformatSizes.in.width = this.convertMmToIn(width);
        this.allformatSizes.in.height = this.convertMmToIn(height);
        break;
    }
  }

  changeSizeType(type) {
    switch (type) {
      case 'px':
        this.width = this.allformatSizes.px.width;
        this.height = this.allformatSizes.px.height;
        break;
      case 'cm':
        this.width = this.allformatSizes.cm.width;
        this.height = this.allformatSizes.cm.height;
        break;
      case 'in':
        this.width = this.allformatSizes.in.width;
        this.height = this.allformatSizes.in.height;
        break;
      case 'mm':
        this.width = this.allformatSizes.mm.width;
        this.height = this.allformatSizes.mm.height;
        break;
    }
  }

  // pixel to other
  convertPxToIn(value): Number {
    return value ? Number((value / 300).toFixed(2)) : 0;
  }

  convertPxToCm(value): Number {
    return value ? Number(((value * 2.54) / 300).toFixed(2)) : 0;
  }

  convertPxToMm(value): Number {
    return value ? Number(((value * 25.4) / 300).toFixed(2)) : 0;
  }

  // centimeter to other
  convertCmToPx(value): Number {
    return value ? Math.floor((value * 300) / 2.54) : 0;
  }

  convertCmToIn(value): Number {
    return value ? Number((value / 2.54).toFixed(2)) : 0;
  }

  convertCmToMm(value): Number {
    return value ? Number((value * 10).toFixed(2)) : 0;
  }

  // inch to other
  convertInToPx(value): Number {
    return value ? Math.floor(value * 300) : 0;
  }

  convertInToCm(value): Number {
    return value ? Number((value * 2.54).toFixed(2)) : 0;
  }

  convertInToMm(value): Number {
    return value ? Number((value * 25.4).toFixed(2)) : 0;
  }

  // mm to other
  convertMmToPx(value): Number {
    return value ? Math.floor((value * 300) / 25.4) : 0;
  }

  convertMmToCm(value): Number {
    return value ? Number((value / 10).toFixed(2)) : 0;
  }

  convertMmToIn(value): Number {
    return value ? Number((value / 25.4).toFixed(2)) : 0;
  }

  get canvasDimension(): object {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  extend(obj: any, id: any) {
    obj.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(self), {
          id: id,
        });
      };
    })(obj.toObject);
  }

  randomId() {
    return Math.floor(Math.random() * 999999) + 1;
  }

  selectItemAfterAdded(obj: any) {
    if (obj) {
      // this.canvas.deactivateAllWithDispatch().renderAll();
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.canvas.setActiveObject(obj);
    }
  }

  removeSelected() {
    console.log('Here');
    let activeObject = this.canvas.getActiveObject(),
      activeGroup = this.canvas.getActiveObjects();
    if (activeObject) {
      this.canvas.remove(activeObject);
      this.canvas.renderAll();
    } else if (activeGroup) {
      let objectsInGroup = activeGroup.getObjects();
      this.canvas.discardActiveGroup();
      let self = this;
      activeGroup.forEach(function (object: any) {
        self.canvas.remove(object);
        self.canvas.renderAll();
      });
    }
  }

  cleanSelect() {
    this.canvas.discardActiveObject().renderAll();
  }

  // addBasicShape
  addBasicShape(shape: any) {
    var option: any = {};
    option['objectCaching'] = false;
    switch (shape.type) {
      case 'Circle':
        if (shape.radius) option['radius'] = shape.radius;
        if (shape.stroke) option['stroke'] = shape.stroke;
        if (shape.strokeWidth) option['strokeWidth'] = shape.strokeWidth;
        if (shape.fill) option['fill'] = shape.fill;
        if (shape.strokeDashArray)
          option['strokeDashArray'] = shape.strokeDashArray;
        var circle = new fabric.Circle(option);
        if (shape.shadow) {
          // circle.setShadow(shape.shadow);
        }
        circle.setControlsVisibility({ mtr: false });
        // this.extend(circle, this.randomId());
        this.canvas.add(circle);
        break;
      case 'Rect':
        if (shape.radius) option['radius'] = shape.radius;
        if (shape.stroke) option['stroke'] = shape.stroke;
        if (shape.strokeWidth) option['strokeWidth'] = shape.strokeWidth;
        if (shape.fill) option['fill'] = shape.fill;
        if (shape.strokeDashArray)
          option['strokeDashArray'] = shape.strokeDashArray;
        option['height'] = 100;
        option['width'] = 100;
        option['top'] = 100;
        option['left'] = 100;
        option['strokeUniform'] = true;
        option['noScaleCache'] = false;
        if (shape.strokeLineCap) option['strokeLineCap'] = shape.strokeLineCap;
        if (shape.rx) option['rx'] = shape.rx;
        if (shape.ry) option['ry'] = shape.ry;
        var rect = new fabric.Rect(option);
        if (shape.shadow) {
          // rect.setShadow(shape.shadow);
        }
        rect.setControlsVisibility({ mtr: false });
        // this.extend(rect, this.randomId());
        this.canvas.add(rect);
        break;
      case 'Line':
        if (shape.fill) option['fill'] = shape.fill;
        if (shape.stroke) option['stroke'] = shape.stroke;
        if (shape.strokeWidth) option['strokeWidth'] = shape.strokeWidth;
        if (shape.strokeDashArray) {
          option['strokeDashArray'] = shape.strokeDashArray;
          // this.props.strokeType = shape.strokeDashArray;
        }
        option['top'] = 100;
        option['left'] = 100;
        var line = new fabric.Line(shape.coOrds, option);
        // this.extend(line, this.randomId());
        this.canvas.add(line);
        break;
    }
  }

  activateAddImageSubTab(subtab: string) {
    switch (subtab) {
      case 'pixalsPhotos':
        if (this.myPhotos == true) {
          this.myPhotos = false;
          this.pixalsPhotos = true;
        }
        break;
      case 'myPhotos':
        if (this.pixalsPhotos == true) {
          this.myPhotos = true;
          this.pixalsPhotos = false;
        }
        break;
      default:
        break;
    }
  }

  setCanvasFill(color: any) {
    this.canvas.backgroundColor = color;
    this.canvas.renderAll();
  }

  getActiveStyle(styleName: any, object: any) {
    object = object || this.canvas.getActiveObject();
    if (!object) return '';
    return object.getSelectionStyles && object.isEditing
      ? object.getSelectionStyles()[styleName] || ''
      : object[styleName] || '';
  }

  applySelectionOnObj() {
    if (this.selected.type !== 'group' && this.selected) {
      switch (this.selected.type) {
        case 'rect':
        case 'circle':
        case 'triangle':
        case 'line':
          this.figureEditor = true;
          this.imageEditor = false;
          if (this.selected.type == 'rect' && this.selected.id == 'pattern') {
            this.figureEditor = false;
          }
          break;
        case 'i-text':
        case 'textbox':
          this.textEditor = true;
          this.imageEditor = false;
          this.props.fill = this.getActiveStyle('fill', null);
          this.selected._clearCache();
          this.canvas.renderAll();
          break;
        case 'image':
          this.textEditor = false;
          this.imageEditor = true;
          this.canvas.renderAll();
          break;
      }
    }
  }

  setActiveProp(name: any, value: any, object: any) {
    object = object || this.canvas.getActiveObject();
    if (!object) return;
    object.set(name, value);
    setTimeout(() => {
      object.setCoords();
      this.canvas.renderAll();
    }, 300);
  }

  setActiveStyle(styleName: any, value: any, object: any) {
    object = object || this.canvas.getActiveObject();
    if (!object) return;
    object.set(styleName, value);
    object.setCoords();
    this.canvas.renderAll();
  }

  trackByFn(item: any) {
    return item.id; // unique id corresponding to the item
  }

  activeFocusedObj(item: any) {
    let that = this;
    let canvas_objs = this.canvas.toJSON();
    this.canvas.forEachObject(function (obj: any) {
      if (obj.toJSON().id && obj.toJSON().id == item.id) {
        that.canvas.discardActiveObject().renderAll();
        that.canvas.setActiveObject(obj);
        that.selected = obj;
        that.applySelectionOnObj();
      } else {
      }
    });
  }

  addImagetoCanvas(image_details) {
    var id,
      that = this,
      img_src = image_details.image;
    // add image as sticker
    // fabric.util.loadImage(
    //   img_src,
    //   function (imgObj) {
    //     let width = imgObj.width;
    //     let height = imgObj.height;
    //     // Image should added in maximum of canvas's 70% area
    //     let maxImageWidth = (that.canvas.width * 70) / 100;
    //     let maxImageHeight = (that.canvas.height * 70) / 100;
    //     imgObj.width = image_details.width;
    //     imgObj.height = image_details.height;
    //     // }
    //     var image = new fabric.Image(imgObj);
    //     image.crossOrigin = 'anonymous';
    //     image.set({
    //       left: 60,
    //       top: 60,
    //       angle: 0,
    //       padding: 0,
    //       // cornersize: 10,
    //       hasRotatingPoint: true,
    //       // width: image_details.width,
    //       // height: image_details.height
    //     });
    //     image.scaleToHeight(image_details.height);
    //     image.scaleToWidth(image_details.width);
    //     var customAttribute = {};
    //     image.toObject = function () {
    //       return {
    //         product_type: image_details.product_type,
    //       };
    //     };
    //     // image.toObject = (function (toObject) {
    //     //   return function () {
    //     //     return fabric.util.object.extend(toObject.call(this), customAttribute);
    //     //   };
    //     // })(image.toObject);
    //     // id = that.randomId();
    //     that.extend(image, id);
    //     setTimeout(() => {
    //       that.canvas.add(image);
    //       that.canvas.renderAll();
    //       console.log(that.canvas);
    //     }, 500);
    //   }, {
    //     crossOrigin: 'anonymous'
    // }
    // );
    fabric.Image.fromURL(
      img_src,
      function (image) {
        var img1 = image;
        img1.crossOrigin = 'anonymous';
        image.toObject = function () {
          return {
            product_type: image_details.product_type,
          };
        };
        image.scale(0.1);
        img1.setControlsVisibility({ mtr: false });
        //   img1.set({
        //     top: 100,
        //     left: 100 ,
        //     width: image_details.width * img1.scaleX,
        //   height: image_details.height,
        // });
        // id = this.randomId();
        // this.extend(img1, id);
        that.canvas.add(img1);
        that.canvas.renderAll();
      },
      {
        crossOrigin: 'anonymous',
        left: 60,
        top: 60,
        angle: 0,
        padding: 0,
        // cornersize: 10,
        hasRotatingPoint: false,
        // width: image_details.width,
        // height: image_details.height,
      }
    );

    // var imgObj = new Image();

    //               imgObj.crossOrigin = "Anonymous";
    //               imgObj.src = img_src

    //               imgObj.onload = function () {
    //                   // start fabricJS stuff
    //                   imgObj.width = 100
    //                   imgObj.height = 100

    //                   var image = new fabric.Image(imgObj);
    //                   image.set({
    //                       top: 60,
    //                       left: 60 ,
    //                   });
    //                   image.toObject = function () {
    //                           return {
    //                             product_type: image_details.product_type,
    //                           };
    //                         };
    //                         that.canvas.add(image);
    //         that.canvas.renderAll();
    //                 }
  }

  getProductCount() {
    let objects = this.canvas.toJSON().objects;
    // console.log("objects : ", objects, this.canvas.toJSON());
    this.productTypes = [];
    var tempTypes: any = [];
    for (let i = 0; i < objects.length; i++) {
      const element = objects[i];
      if (element?.product_type) {
        tempTypes.push(element.product_type);
      }
    }

    var count = {};
    tempTypes.forEach(function (i) {
      count[i] = (count[i] || 0) + 1;
    });
    console.log(count);
    let t: any,
      key,
      credit_note: any = [];
    for (let tag in count) {
      t = {
        key: tag,
        value: count[tag],
      };
      this.productTypes.push(t);
    }
    console.log(this.productTypes);
    // var result = Object.keys(count).map((key) => [{type: key, count : count[key]}]);

    // console.log(result);
  }

  rotateSelected() {
    console.log('this.selected : ', this.selected);
    this.rotateObjAfterAdded(this.selected[0], this.selected[0].angle + 90);
  }
}
