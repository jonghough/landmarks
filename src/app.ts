import "@babylonjs/core/Debug/debugLayer";
import * as GUI from 'babylonjs-gui';
import * as BABYLON from "@babylonjs/core";
//import { default as Geo } from "./geofuncs.js";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui/2D";
import { Material, PointerInfo } from "babylonjs";
import { CustomBox } from "./CustomBox";
import { TileData } from "./TileData";
import { GlobalConfig } from "./GlobalConfig";
import { Tiler } from "./tiles";
import { FullScreenButton } from "./FullScreenButton";
import { UndoStack } from "./undo/undostack";
import { CreateCustomBoxUndo } from "./undo/CreateCustomBoxUndo";
import { InputManager } from "./InputManager";

export enum AppMode {
    Idle,
    CreateBox,
    SelectBox,
    BoxSelected,
    Translate,
    ScaleX,
    ScaleY,
    ScaleZ,
    Rotate
}
export class App {

    scene: BABYLON.Scene;
    camera: BABYLON.UniversalCamera;
    moveForward: boolean = false;
    moveBackward: boolean = false;
    moveRight: boolean = false;
    moveLeft: boolean = false;
    moveUp: boolean = false;
    loadedTiles = new Map();
    appMode: AppMode = AppMode.CreateBox;
    createButton: FullScreenButton;
    translateButton: FullScreenButton;
    rotateButton: FullScreenButton;
    scaleButton: FullScreenButton;
    customBoxes: Map<string, CustomBox> = new Map();
    currentBox: string | null = null;
    undoStack: UndoStack = new UndoStack(100);
    redoStack: UndoStack = new UndoStack(100);
    inputManager: InputManager | null = null;

    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(engine);
        this.scene.blockMaterialDirtyMechanism = true;
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1.0);
        this.camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 2, -25), this.scene);
        console.log(this.camera.inputs.attached)
        this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
        this.camera.attachControl(canvas, true);
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 10000, 0), this.scene);
        light1.intensity = 1.0;
        this.camera.setTarget(BABYLON.Vector3.Zero());



        let __this = this;
        this.createButton = new FullScreenButton("create", 10, () => {
            __this.appMode = AppMode.CreateBox; console.log("create")
        });
        this.translateButton = new FullScreenButton("translate", 10 + (150 + 5), () => {
            console.log("trasnlate");
            __this.appMode = AppMode.Translate
        });
        this.scaleButton = new FullScreenButton("scale", 10 + (150 + 5) * 2, () => {
            console.log("scaling")
            __this.appMode = AppMode.ScaleX
        });
        this.rotateButton = new FullScreenButton("rotate", 10 + (150 + 5) * 3, () => {
            __this.appMode = AppMode.Rotate;
            console.log("rotating")
        });



        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show();
                }
            }
        });

        this.registerSceneUpdates();
        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });

        let globalConfig = new GlobalConfig("s", 19, true, 10, 10, 15500000, 4200000, false, (s) => { });
        let td = new TileData("", globalConfig, new Tiler(), 35.62705161375659, 139.56041440100566);
        td.setupTileBoundaryLines(this.scene)
        let bounds = td.ndsTileBounds;
        this.camera.position.x = 15500000 - bounds[0];
        this.camera.position.y += 20;
        this.camera.position.z = 4200000 - bounds[1] - 100;

    }

    setup() {

        this.inputManager = new InputManager(this);
    }

    doUndo() {
        let undo = this.undoStack.pop();
        if (undo) {
            undo.undo();
            this.redoStack.push(undo);
        }
    }

    doRedo() {
        let undo = this.redoStack.pop();
        if (undo) {
            undo.undo();
            this.undoStack.push(undo);
        }
    }


    createCustomBox(v: BABYLON.Vector3) {
        let cb = new CustomBox(v, v.add(new BABYLON.Vector3(10, 0, 10)), this.scene);
        this.customBoxes.set(cb.name, cb);
        this.currentBox = cb.name;
        let undo = new CreateCustomBoxUndo(this.customBoxes, cb);
        this.undoStack.push(undo);
    }

    registerSceneUpdates() {
        let __this = this;

        var time = 0;
        this.scene.registerBeforeRender(function () {
            let dt = __this.scene.getEngine().getDeltaTime();
            time += dt;
            // __this.boundarylineMaterial.setFloat("u_time", time / 100);
            // __this.centerlineMaterial.setFloat("u_time", time / 100);
            // __this.selectedMaterial.setFloat("u_time", time / 500);


            let forward = new BABYLON.Vector3(0, 0, 1);
            let up = new BABYLON.Vector3(0, 1, 0);
            if (__this.camera.getTarget() !== null) {
                forward = __this.camera.getTarget().subtract(__this.camera.position).normalize();
            }
            forward.y = 0;
            var right = BABYLON.Vector3.Cross(forward, __this.camera.upVector).normalize();
            right.y = 0;

            var SPEED = 0.075;
            let forwardSpeed = 0;
            let lateralSpeed = 0;
            let upwardSpeed = 0;



            if (__this.moveForward) {
                forwardSpeed = SPEED;
            }
            if (__this.moveBackward) {
                forwardSpeed = -SPEED;
            }

            if (__this.moveRight) {
                lateralSpeed = SPEED;
            }

            if (__this.moveLeft) {
                lateralSpeed = -SPEED;
            }
            if (__this.moveUp) {
                upwardSpeed = SPEED;
            }

            var move = forward.scale(forwardSpeed * dt).subtract(right.scale(lateralSpeed * dt)).add(up.scale(upwardSpeed * dt));

            __this.camera.position.x += move.x;
            __this.camera.position.y += move.y;
            __this.camera.position.z += move.z;

            __this.camera.setTarget(__this.camera.position.add(__this.camera.getForwardRay().direction));
            // ref: https://www.babylonjs-playground.com/#H6FZQ2#21
        });
    }

    setSelectMode() {

        this.appMode = AppMode.BoxSelected;
    }
    setRotateMode() {

        this.appMode = AppMode.Rotate;
    }
    setScaleMode(axis: string) {
        if (axis == "x")
            this.appMode = AppMode.ScaleX;
        else if (axis == "y")
            this.appMode = AppMode.ScaleY;
        else if (axis == "z")
            this.appMode = AppMode.ScaleZ
        else
            throw Error("Could not find axis");
    }
    setTranslateMode() {

        this.appMode = AppMode.Translate;
    }
    setIdleMode() {
        this.appMode = AppMode.Idle;
    }
    setCreateMode() {
        console.log("create mode");
        this.appMode = AppMode.CreateBox;
    }
    saveToFile() { }



    createShaders() {
        BABYLON.Effect.ShadersStore["boundaryVertexShader"] =
            `
   precision highp float;
   // Attributes
   attribute vec3 position;
   attribute vec2 uv;
   // Uniforms
   uniform mat4 worldViewProjection;
   // Varying
   varying vec2 vUV;
   void main(void) {
       gl_Position = worldViewProjection * vec4(position, 1.0);
       vUV = uv;
   }`;

        BABYLON.Effect.ShadersStore["boundaryFragmentShader"] =
            `
  
uniform float u_time; 

void main(void) {
    vec3 color = vec3(0.5,0,0) + 0.5 * vec3(sin(u_time),0,0);

    // Output the color
    gl_FragColor = vec4(color, 1.0); 
}
`;


        BABYLON.Effect.ShadersStore["centerlineVertexShader"] =
            `
precision highp float;
// Attributes
attribute vec3 position;
attribute vec2 uv;
// Uniforms
uniform mat4 worldViewProjection;
// Varying
varying vec2 vUV;
void main(void) {
gl_Position = worldViewProjection * vec4(position, 1.0);
vUV = uv;
}`;

        BABYLON.Effect.ShadersStore["centerlineFragmentShader"] =
            `

uniform float u_time;

void main(void) {
vec3 color = vec3(0.0,0.5,0) + 0.5 * vec3(0,cos(u_time),0);

// Output the color
gl_FragColor = vec4(color, 1.0); 
}
`;


        BABYLON.Effect.ShadersStore["selectedVertexShader"] =
            `
precision highp float;
// Attributes
attribute vec3 position;
attribute vec2 uv;
// Uniforms
uniform mat4 worldViewProjection;
// Varying
varying vec2 vUV;
void main(void) {
gl_Position = worldViewProjection * vec4(position, 1.0);
vUV = uv;
}`;

        BABYLON.Effect.ShadersStore["selectedFragmentShader"] =
            `

uniform float u_time;

void main(void) {
vec3 color = vec3(0.5,0.5,0.5) + 0.5*vec3(cos(u_time),cos(0.24*u_time),sin(0.1*u_time));

// Output the color
gl_FragColor = vec4(color, 1.0); 
}
`;

    }

}




