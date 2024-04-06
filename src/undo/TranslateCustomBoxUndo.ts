import { CustomBox } from "../CustomBox";
import { Undo } from "./undo";
import * as BABYLON from "@babylonjs/core";




export class TranslateCustomBoxUndo extends Undo{

    constructor(readonly customBox:CustomBox, readonly originalPosition :BABYLON.Vector3, readonly nextPosition: BABYLON.Vector3){
        super();
    }
    undo(): void {
        this.customBox.move(this.originalPosition);
    }

    redo(): void { 
        this.customBox.move(this.nextPosition)
    }
}