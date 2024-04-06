import * as BABYLON from "@babylonjs/core";
import { int } from "babylonjs";
import { connect } from "http2";
import { Tiler } from "./tiles";
import { GlobalConfig } from "./GlobalConfig";
import { App, AppMode } from "./app";


export class PointerPositions {
    ptrDownPos: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    ptrMovePos: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    ptrUpPos: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    constructor(readonly pointer: number) { }
}
export class InputManager {


    pointer0: PointerPositions = new PointerPositions(0);
    pointer1: PointerPositions = new PointerPositions(1);
    pointer2: PointerPositions = new PointerPositions(2);

    app: App;


    constructor(app: App) {
        this.app = app;
        this.registerMouseUp();
        this.registerSceneUpdates();
    }

    private registerMouseUp() {
        let __this = this;
        this.app.scene.onPointerUp = function (p, pick) {

            if (pick == null) {
                throw new Error();
            }
            console.log("clicked " + __this.app.appMode)
            if (pick.hit && pick.pickedPoint != null) {
                console.log(pick.pickedMesh?.name)
                switch (__this.app.appMode) {
                    case AppMode.CreateBox: {
                        // alert(pick.pickedPoint.x + ' ' + pick.pickedPoint.y + ' ' + pick.pickedPoint.z);
                        let v: BABYLON.Vector3 = pick.pickedPoint;
                        console.log(v)
                        __this.app.createCustomBox(v);
                        __this.app.appMode = AppMode.BoxSelected;
                        break;
                    }
                    case AppMode.ScaleX: {
                        if (!__this.app.currentBox) {
                            break;
                        }
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        if (cb != null) {
                            console.log("set point 2")
                            let v: BABYLON.Vector3 = pick.pickedPoint;
                            // cb.changeCorners(thisScene, v.add(new BABYLON.Vector3(10, 60, 10)));
                            let undo = cb.scaleX(v);
                            __this.app.undoStack.push(undo)
                        } else {
                            console.log("NULL cb")
                        }
                        break;
                    }
                    case AppMode.ScaleY: {
                        break;
                    }
                    case AppMode.Rotate: {
                        if (!__this.app.currentBox) {
                            break;
                        }
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        if (cb != null) {
                            let undo = cb.rotate(pick.pickedPoint);
                            __this.app.undoStack.push(undo);
                        }
                        break;
                    }
                    case AppMode.Translate: {
                        if (!__this.app.currentBox) {
                            break;
                        }
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        if (cb != null) {
                            let undo = cb.move(pick.pickedPoint);
                            __this.app.undoStack.push(undo);

                        }
                        break;
                    }
                    case AppMode.Idle | AppMode.BoxSelected: {
                        if (pick.pickedMesh) {
                            let name = pick.pickedMesh.name;
                            if (__this.app.customBoxes.has(name)) {
                                let c = __this.app.customBoxes.get(name);
                                if (c != null) {

                                    let cb = __this.app.customBoxes.get(name);
                                    __this.app.currentBox = name;
                                    __this.app.appMode = AppMode.BoxSelected;
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    registerSceneUpdates() {
        const __this = this;
        var onKeyDown = function (event: KeyboardEvent) {
            switch (event.key) {
                case "ArrowUp": // up
                case "w": // w
                    if (__this.app.currentBox && __this.app.appMode == AppMode.ScaleX) {
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        let undoObj = cb?.scaleXBy(1);
                        if (undoObj) __this.app.undoStack.push(undoObj);
                    }
                    else if (__this.app.currentBox && __this.app.appMode == AppMode.ScaleY) {
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        let undoObj = cb?.scaleYBy(1);
                        if (undoObj) __this.app.undoStack.push(undoObj);
                    }
                    else if (__this.app.currentBox && __this.app.appMode == AppMode.ScaleZ) {
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        let undoObj = cb?.scaleZBy(1);
                        if (undoObj) __this.app.undoStack.push(undoObj);

                    } else {
                        __this.app.moveForward = true;
                    } break;

                case "ArrowLeft": // left
                case "a": // a
                    __this.app.moveLeft = true; break;

                case "ArrowDown": // down
                case "s": // s
                    if (__this.app.currentBox && __this.app.appMode == AppMode.ScaleX) {
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        let undoObj = cb?.scaleXBy(-1);
                        if (undoObj) __this.app.undoStack.push(undoObj);
                    }
                    else if (__this.app.currentBox && __this.app.appMode == AppMode.ScaleY) {
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        let undoObj = cb?.scaleYBy(-1);
                        if (undoObj) __this.app.undoStack.push(undoObj);
                    }
                    else if (__this.app.currentBox && __this.app.appMode == AppMode.ScaleZ) {
                        let cb = __this.app.customBoxes.get(__this.app.currentBox);
                        let undoObj = cb?.scaleZBy(-1);
                        if (undoObj) __this.app.undoStack.push(undoObj);
                    }
                    else {
                        __this.app.moveBackward = true;
                    }
                    break;

                case "ArrowRight": // right
                case "d": // d
                    __this.app.moveRight = true;
                    break;

                case "Space": //up
                case " ":
                    __this.app.moveUp = true;
                    break;
                case "x":
                    __this.app.appMode = AppMode.ScaleX;

                    break;

                case "y":
                    __this.app.appMode = AppMode.ScaleY;
                    break;

                case "z":
                    __this.app.appMode = AppMode.ScaleZ;
                    break;
                default:
                    break;
            }
        };



        var onKeyUp = function (event: KeyboardEvent) {
            switch (event.key) {
                case "ArrowUp": // up
                case "w": {// w

                    __this.app.moveForward = false;

                    break;
                }
                case "ArrowLeft": // left
                case "a": // a

                    __this.app.moveLeft = false;
                    break;

                case "ArrowDown": // down
                case "s": // s
                    __this.app.moveBackward = false;
                    break;

                case "ArrowRight": // right
                case "d": // d
                    __this.app.moveRight = false;
                    break;
                case "Space": //up
                case " ":
                    __this.app.moveUp = false;
                case "x":
                    __this.app.appMode = AppMode.Idle;
                    break;

                case "y":
                    __this.app.appMode = AppMode.Idle;
                    break;

                case "z":
                    __this.app.appMode = AppMode.Idle;
                    break;
            }
        };

        var onMouseDown = function (event: MouseEvent) {
            console.log("BUTTON DOWN " + event.button);
        };


        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
        document.addEventListener('mousedown', onMouseDown, false);

    }
}