import "@babylonjs/core/Debug/debugLayer";
import * as BABYLON from "@babylonjs/core";
import { TileData } from "./TileData";
import { GlobalConfig } from "./GlobalConfig";
import { Tiler } from "./tiles";
import { TileInfoBillboard } from "./tileinfobillboard";
import locations from './companies.json';
import tokyo from './tokyo.json';


export class App {

    scene: BABYLON.Scene;
    camera: BABYLON.UniversalCamera;
    moveForward: boolean = false;
    moveBackward: boolean = false;
    moveRight: boolean = false;
    moveLeft: boolean = false;
    moveUp: boolean = false;
    loadedTiles = new Map();
    companyObjects: Array<TileInfoBillboard> = new Array<TileInfoBillboard>();
    cameraDefaultPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
    tiles: Array<TileData> = new Array<TileData>();
    globalConfig: GlobalConfig;
    infoDialogOpenCallback: (title: string, text: string) => void;
    public uniqueSegments: Set<string> = new Set<string>();

    constructor(infoDialogOpenCallback: (title: string, text: string) => void) {
        this.globalConfig = new GlobalConfig("s", 19, true, 10, 10, 15500000, 4200000, true, (s) => { });
        this.infoDialogOpenCallback = infoDialogOpenCallback;
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "landmarkCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(engine);
        this.scene.blockMaterialDirtyMechanism = true;
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1.0);
        this.camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 2, -25), this.scene);
        this.camera.maxZ = 1000000;

        this.camera.attachControl(canvas, true);
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 10000, 0), this.scene);
        light1.intensity = 1.0;
        this.camera.setTarget(BABYLON.Vector3.Zero());

        this.registerSceneUpdates();
        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });




        let t = new Tiler();
        // hardcoded "center" of Tokyo.
        // TODO make variable...
        let b = t.laloToTile(35.690838971083906, 139.7271607570098, 15);

        for (var i = -10; i < 10; i++) {
            for (var j = -10; j < 10; j++) {
                let td = new TileData("", this.globalConfig, new Tiler(), b[0] + i, b[1] + j, 15);

                td.setupTileBoundaryLines(this.scene);
                this.tiles.push(td);
                let bounds = td.ndsTileBounds;
                if (i == 0 && j == 0) {
                    this.camera.position.x = this.globalConfig.offsetX - bounds[0];
                    this.camera.position.y = 500;
                    this.camera.position.z = this.globalConfig.offsetY - bounds[1] - 100;
                    this.cameraDefaultPosition = this.camera.position.clone();
                }
            }
        }

        let loc = locations;


        let tok = tokyo;
        tok.features.forEach(f => {
            let coords = f.geometry.coordinates;
            coords.forEach(poly => {
                let convCoords = poly[0].map(c => {
                    let x = this.globalConfig.offsetX - c[0];
                    let y = this.globalConfig.offsetY - c[1];
                    return new BABYLON.Vector3(x, 0.2, y);
                });
                let boundsgrid = {
                    points: convCoords,
                    updatable: false,
                };
                let lines = BABYLON.MeshBuilder.CreateLines("lines_", boundsgrid, this.scene);
                lines.color = new BABYLON.Color3(1, 0.2, 0.2);
            });
        });

        this.uniqueSegments = new Set<string>();

        loc.locations.forEach((location: { name: string; segments: string[] }) => {
            location.segments.forEach((segment: string) => {
                this.uniqueSegments.add(segment);
            });
        });
    }

    createBySegment(segment: string) {
        let t = new Tiler();
        let loc = locations;
        loc.locations.forEach((location) => {
            if (location.segments.includes(segment)) {
                let tinfo = new TileInfoBillboard(this.infoDialogOpenCallback, location.location[0], location.location[1]);
                let meters = t.laloToMeters(location.location[0], location.location[1]);
                let ox = this.globalConfig.offsetX - meters[0];
                let oy = this.globalConfig.offsetY - meters[1];
                tinfo.createTileInfoBillboard(this.scene, new BABYLON.Vector3(ox, 1250, oy), location.name, location.address, location.homepage, location.segments)
                tinfo.show(segment);
                this.companyObjects.push(tinfo);
            }
        });

    }

    clearBillboards() {
        this.companyObjects.forEach(t => t.dispose());
        this.companyObjects = new Array<TileInfoBillboard>();
    }


    selectBySegment(segment: string) {
        this.clearBillboards();
        this.createBySegment(segment);
    }

    centerCamera() {
        this.camera.position = this.cameraDefaultPosition.clone();
    }

    refreshTiles(tileSet: string) {
        this.globalConfig.xyzTileSet = "r";

        this.tiles.forEach(t => {
            switch (tileSet) {
                case "Google Satellite":
                    t.tileSet = "s";
                    break;
                case "Google Roadmap":
                    t.tileSet = "m";
                    break;
                case "Google Hybrid":
                    t.tileSet = "y";
                    break;
                default:
                    break;
            }
            t.refreshTiles(this.scene);
        });
    }




    registerSceneUpdates() {
        let __this = this;


        var onKeyDown = function (event: KeyboardEvent) {
            switch (event.key) {
                case "ArrowUp": // up
                case "w": // w
                    __this.moveForward = true;
                    break;

                case "ArrowLeft": // left
                case "a": // a
                    __this.moveLeft = true; break;

                case "ArrowDown": // down
                case "s": // s
                    __this.moveBackward = true;
                    break;

                case "ArrowRight": // right
                case "d": // d
                    __this.moveRight = true;
                    break;

                case "Space": //up
                case " ":
                    __this.moveUp = true;
                    break;
                default:
                    break;
            }
        };

        var onKeyUp = function (event: KeyboardEvent) {
            switch (event.key) {
                case "ArrowUp": // up
                case "w": // w
                    __this.moveForward = false;
                    break;

                case "ArrowLeft": // left
                case "a": // a
                    __this.moveLeft = false;
                    break;

                case "ArrowDown": // down
                case "s": // s
                    __this.moveBackward = false;
                    break;

                case "ArrowRight": // right
                case "d": // d
                    __this.moveRight = false;
                    break;
                case "Space": //up
                case " ":
                    __this.moveUp = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);

        var time = 0;
        this.scene.registerBeforeRender(function () {
            let dt = __this.scene.getEngine().getDeltaTime();
            time += dt;

            let forward = new BABYLON.Vector3(0, 0, 1);
            let up = new BABYLON.Vector3(0, 1, 0);
            if (__this.camera.getTarget() !== null) {
                forward = __this.camera.getTarget().subtract(__this.camera.position).normalize();
            }

            var right = BABYLON.Vector3.Cross(forward, __this.camera.upVector).normalize();

            let forwardSpeed = 0;
            let lateralSpeed = 0;
            let upwardSpeed = 0;

            if (__this.moveForward) {
                forwardSpeed = __this.globalConfig.cameraForwardSpeed;;
            }
            if (__this.moveBackward) {
                forwardSpeed = -__this.globalConfig.cameraForwardSpeed;;
            }

            if (__this.moveRight) {
                lateralSpeed = __this.globalConfig.cameraLateralSpeed;;
            }

            if (__this.moveLeft) {
                lateralSpeed = -__this.globalConfig.cameraLateralSpeed;;
            }
            if (__this.moveUp) {
                upwardSpeed = __this.globalConfig.cameraForwardSpeed;;
            }
            var move = forward.scale(forwardSpeed * dt).subtract(right.scale(lateralSpeed * dt)).add(up.scale(upwardSpeed * dt));

            __this.camera.position.x += move.x;
            __this.camera.position.y += move.y;
            __this.camera.position.z += move.z;

            __this.camera.setTarget(__this.camera.position.add(__this.camera.getForwardRay().direction));
            // ref: https://www.babylonjs-playground.com/#H6FZQ2#21
        });
    }




}




