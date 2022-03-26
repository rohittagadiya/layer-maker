import { Component, OnInit } from '@angular/core';
import { BASICSHAPELIST, CANVASCONFIGOPTIONS, COLORS, FONTSLIST, OBJECTDEFAULTPROPERTIES } from './image.constant';

import { fabric } from 'fabric';
import { HttpService } from '../services/http.service';
// import * as $ from "jquery";
// declare var require: any
// const fs = require('fs')
@Component({
  selector: 'app-layout-maker',
  templateUrl: './layout-maker.component.html',
  styleUrls: ['./layout-maker.component.scss']
})
export class LayoutMakerComponent implements OnInit {

  // @BlockUI('editorBlock') blockUI: NgBlockUI;
  public context: any;
  public canvas: any;
  canvasWidth: number;
  canvasHeight: number;
  resize_canvas_during_paste: boolean = false;
  canvasObjectList: any = [];
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

  allProducts:any = [];

  constructor(
    public httpService: HttpService
  ) {
    let that = this;
    this.processKeys = function (e: any) {
      if (that.selected) {
        let movementDelta = 5;
        if (e.keyCode === 46) {
          // delete || backspace e.keyCode === 8;
          e.preventDefault();
          that.removeSelected();
        }

        if (e.keyCode === 27) {
          // ESC
          e.preventDefault();
          that.cleanSelect();
        }

        if (e.keyCode === 38) {
          // UP ARROW
          e.preventDefault();
          that.selected.top -= movementDelta;
          that.canvas.renderAll();
        }

        if (e.keyCode === 40) {
          // DOWN ARROW
          e.preventDefault();
          that.selected.top += movementDelta;
          that.canvas.renderAll();
        }

        if (e.keyCode === 37) {
          // LEFT ARROW
          e.preventDefault();
          that.selected.left -= movementDelta;
          that.canvas.renderAll();
        }

        if (e.keyCode === 39) {
          // RIGHT ARROW
          e.preventDefault();
          that.selected.left += movementDelta;
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
    // fabric.Object.prototype.set(this.objectPrototypeDefaults) Partial<Details>;
    //setup front side canvas
    this.canvas = new fabric.Canvas('canvas', this.canvasConfigOptions);

    this.canvas.on({
      'object:added': (e: any) => { },
      'object:selected': (e: any) => {
        this.selected = e.target;
        console.log(this.selected);
        this.layerSelected = JSON.parse(JSON.stringify(this.selected));
        this.applySelectionOnObj();
      },
      'selection:created': (e: any) => {
        this.selected = e.target;
        console.log(this.selected);
        this.layerSelected = JSON.parse(JSON.stringify(this.selected));
        this.applySelectionOnObj();
      },
      'selection:cleared': (e: any) => {
        this.selected = null;
      },
    });

    this.setCanvasFill('#ffffff');
  }

  fileChange(event) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: any) => {
        // this.addOneCategory.logo = event.target.result;
      }
      reader.readAsDataURL(event.target.files[0]);
    }
    this.fileList = event.target.files;
    if (this.fileList.length > 0) {
      this.formData.delete("file");
      for (let i = 0; i < this.fileList.length; i++) {
        this.formData.append('file', this.fileList[i]);
        this.addPhoto();
      }
    }
  }

  addPhoto() {
      this.httpService.getData('addProductByUser', this.formData, '').then((result: any) => {
        if (result.code == 200) {
          // this.getCategory();
          this.fetchAllProducts();
        }
        else if (result.code == 201) {
          // this.utils.hideLoader();
          // this.utils.sweetAlertError({ title: "", message: result.message, icon: 'error', second: TIMER.LONG });
        }
        else {
          // this.utils.hideLoader();
          // this.utils.sweetAlertError({ title: "", message: result.message, icon: 'error', second: TIMER.LONG });
        }
      }, (err: any) => {
        // this.utils.hideLoader();
        // this.utils.sweetAlertError({ title: "", message: ERROR.SERVER_INTERNET_ERR, icon: 'error', second: TIMER.MEDIUM });
      }).catch((err: any) => {
        // this.utils.hideLoader();
        // this.utils.sweetAlertError({ title: "", message: ERROR.SERVER_INTERNET_ERR, icon: 'error', second: TIMER.MEDIUM });
      });
    // }
  }

  fetchAllProducts(){
    this.httpService.getData1('getProducts',{}).then((result:any) => {
      console.log("result : ", result)
      this.allProducts = result.data;
    })
  }

  createCanvas() {
    this.canvas.setWidth(this.canvasWidth);
    this.canvas.setHeight(this.canvasHeight);
  }

  extend(obj: any, id: any) {
    obj.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(), {
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
        this.extend(circle, this.randomId());
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
        if (shape.strokeLineCap) option['strokeLineCap'] = shape.strokeLineCap;
        if (shape.rx) option['rx'] = shape.rx;
        if (shape.ry) option['ry'] = shape.ry;
        var rect = new fabric.Rect(option);
        if (shape.shadow) {
          // rect.setShadow(shape.shadow);
        }
        this.extend(rect, this.randomId());
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
        this.extend(line, this.randomId());
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
    var id, that = this, img_src=image_details.image;
    // add image as sticker
    fabric.util.loadImage(img_src, function (imgObj) {
      let width = imgObj.width;
      let height = imgObj.height;
      let height2, width2;
      // Image should added in maximum of canvas's 70% area
      let maxImageWidth = 500 * 70 / 100;
      let maxImageHeight = 500 * 70 / 100;
      if (height > maxImageHeight) {
        let scale = maxImageHeight / height;
        imgObj.width = imgObj.width * scale;
        imgObj.height = imgObj.height * scale;
        height2 = imgObj.height * scale;
        width2 = imgObj.width * scale;
        width = imgObj.width;
      }
      if (width > maxImageWidth) {
        let scale = maxImageWidth / width;
        imgObj.width = imgObj.width * scale;
        imgObj.height = imgObj.height * scale;
      }
      var image = new fabric.Image(imgObj);
      image.crossOrigin = "anonymous";
      image.set({
        left: 10,
        top: 10,
        angle: 0,
        padding: 0,
        // cornersize: 10,
        hasRotatingPoint: true,
      });
      var customAttribute = {}
      // image.toObject = (function (toObject) {
      //   return function () {
      //     return fabric.util.object.extend(toObject.call(this), customAttribute);
      //   };
      // })(image.toObject);
      // id = that.randomId();
      // that.extend(image, id);
      setTimeout(() => {
        that.canvas.add(image);
        that.canvas.renderAll();
      }, 500);
    }, null);
    return id;
  }

}
