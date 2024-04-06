import * as BABYLON from "@babylonjs/core";
import { AdvancedDynamicTexture, Button , Control} from "@babylonjs/gui/2D";
import * as GUI from 'babylonjs-gui';

export class FullScreenButton{

    advancedTexture : AdvancedDynamicTexture;
    button1 : Button;

    constructor(readonly text: string, readonly leftInPixels : number, readonly onclick : ()=>void){
       this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    this.button1 = Button.CreateSimpleButton("but1", this.text);
    this.button1.width = "150px"
    this.button1.height = "40px";
    this.button1.color = "white";
    this.button1.cornerRadius = 20;
    this.button1.background = "green"; 
    this.button1.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.button1.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.button1.leftInPixels=this.leftInPixels;
    let clickCallback = this.onclick;
    this.button1.onPointerUpObservable.add(function() {
        
        clickCallback();
    });
    this.advancedTexture.addControl(this.button1);   
    }
}