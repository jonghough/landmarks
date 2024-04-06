import { CustomBox } from "../CustomBox";
import { Undo } from "./undo";
import * as BABYLON from "@babylonjs/core";



export class ScaleCustomBoxUndo extends Undo {

    constructor(readonly customBox: CustomBox, readonly originalScale: BABYLON.Vector3, readonly nextScale: BABYLON.Vector3, readonly axis: string) {
        super();
    }
    undo(): void {
        switch (this.axis) {
            case "x":
                this.customBox.scaleXBy(this.originalScale.x);
                break;
            case "y":
                this.customBox.scaleYBy(this.originalScale.y);
                break;
            case "z":
                this.customBox.scaleZBy(this.originalScale.z);
                break;
            default:
                throw new Error("Cannot undo action");
        }
    }

    redo(): void { 
        switch (this.axis) {
            case "x":
                this.customBox.scaleXBy(this.nextScale.x);
                break;
            case "y":
                this.customBox.scaleYBy(this.nextScale.y);
                break;
            case "z":
                this.customBox.scaleZBy(this.nextScale.z);
                break;
            default:
                throw new Error("Cannot undo action");
        }
    }
}