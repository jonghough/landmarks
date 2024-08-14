import "@babylonjs/core/Debug/debugLayer";
import * as BABYLON from "@babylonjs/core";
import { TileData } from "./TileData";
import { GlobalConfig } from "./GlobalConfig";
import { Tiler } from "./tiles";
import { InfoBillboard } from "./InfoBillboard";
import locations from './companies.json';
import tokyo from './tokyo.json';
import tokyoRoads from './tokyo_roads.json';
import tokyoRail from './tokyo_rail.json';
import { TileCache } from "./TileCache";


export class App {

    scene: BABYLON.Scene;
    camera: BABYLON.UniversalCamera;
    moveForward: boolean = false;
    moveBackward: boolean = false;
    moveRight: boolean = false;
    moveLeft: boolean = false;
    moveUp: boolean = false;
    loadedTiles = new Map();
    companyObjects: Array<InfoBillboard> = new Array<InfoBillboard>();
    cameraDefaultPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
    tiles: Array<TileData> = new Array<TileData>();
    globalConfig: GlobalConfig;
    infoDialogOpenCallback: (title: string, text: string, homePage: string) => void;
    public uniqueSegments: Set<string> = new Set<string>();
    tileCache: TileCache = new TileCache(150);
    constructor(infoDialogOpenCallback: (title: string, text: string, homePage: string) => void) {
        this.globalConfig = new GlobalConfig("s", 12, true, 3.5, 5, 15500000, 4200000, true, (s) => { });
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
        let [[minLat, minLon], [maxLat, maxLon]] = this.getLocationBounds()
        let m00 = t.laloToTile(minLat, minLon, this.globalConfig.xyzTileZoomLevel);
        let m11 = t.laloToTile(maxLat, maxLon, this.globalConfig.xyzTileZoomLevel);


        for (var i = m00[0]; i < m11[0] + 1; i++) {
            for (var j = m00[1]; j < m11[1] + 1; j++) {

                let td = new TileData("", this.globalConfig, new Tiler(), i, j, -1, this.globalConfig.xyzTileZoomLevel);

                td.setupTileBoundaryLines(this.scene);
                this.tiles.push(td);
                let bounds = td.ndsTileBounds;
                if (i == Math.floor((m11[0] + m00[0]) / 2) && j == Math.floor((m11[1] + m00[1]) / 2)) {
                    this.camera.position.x = this.globalConfig.offsetX - bounds[0];
                    this.camera.position.y = 500;
                    this.camera.position.z = this.globalConfig.offsetY - bounds[1] - 100;
                    this.cameraDefaultPosition = this.camera.position.clone();
                }

            }
        }

        // let mxx = t.laloToTile(35.64235879570655, 139.71347778350273, this.globalConfig.xyzTileZoomLevel + 4);
        // let tdx = new TileData("", this.globalConfig, new Tiler(), mxx[0], mxx[1], 30, this.globalConfig.xyzTileZoomLevel + 4);
        // let zoomedTiles = this.getUniqueTiles(t, this.globalConfig.xyzTileZoomLevel + 4);
        // tdx.setupTileBoundaryLines(this.scene);
        // this.tiles.push(tdx);
        this.showTokyoBoundaries();
        this.showTokyoRoads(t);
        this.showTokyoRail(t);

        this.uniqueSegments = new Set<string>();

        let loc = locations;
        loc.locations.forEach((location: { name: string; segments: string[] }) => {
            location.segments.forEach((segment: string) => {
                this.uniqueSegments.add(segment);
            });
        });
    }

    showTokyoBoundaries() {
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
    }

    showTokyoRoads(t: Tiler) {
        let tok = tokyoRoads;
        tok.features.forEach(f => {
            let coords = f.geometry.coordinates;
            coords.forEach(lineStr => {
                let convCoords = lineStr.map(c => {
                    let meters = t.laloToMeters(c[1], c[0]);
                    let x = this.globalConfig.offsetX - meters[0];
                    let y = this.globalConfig.offsetY - meters[1];
                    return new BABYLON.Vector3(x, 31.6, y);
                });
                let boundsgrid = {
                    points: convCoords,
                    updatable: false,
                };
                let lines = BABYLON.MeshBuilder.CreateLines("lines_", boundsgrid, this.scene);
                lines.color = new BABYLON.Color3(0.2, 0.7, 0.2);
            });
        });
    }
    showTokyoRail(t: Tiler) {
        let tok = tokyoRail;
        tok.features.forEach(f => {
            let coords = f.geometry.coordinates;
            coords.forEach(lineStr => {
                let convCoords = lineStr.map(c => {
                    let meters = t.laloToMeters(c[1], c[0]);
                    let x = this.globalConfig.offsetX - meters[0];
                    let y = this.globalConfig.offsetY - meters[1];
                    return new BABYLON.Vector3(x, 31.6, y);
                });
                let boundsgrid = {
                    points: convCoords,
                    updatable: false,
                };
                let lines = BABYLON.MeshBuilder.CreateLines("lines_", boundsgrid, this.scene);
                lines.color = new BABYLON.Color3(0.2, 0.7, 0.99);
            });
        });
    }
    getUniqueTiles(t: Tiler, zoom: number) {
        let loc = locations;

        const uniqueList: [number, number][] = Array.from(
            new Set(loc.locations.map(l => t.laloToTile(l.location[0], l.location[1], zoom)).map(pair => JSON.stringify(pair)))
        ).map(str => JSON.parse(str) as [number, number]);

        let utiles = uniqueList.map(item => new TileData("", this.globalConfig, t, item[0], item[1], 30, zoom));

        utiles.forEach(t => t.setupTileBoundaryLines(this.scene));
        // this.tiles.push(tdx);
        return utiles;
    }


    getLocationBounds() {
        let loc = locations;
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLon = Infinity;
        let maxLon = -Infinity;
        loc.locations.forEach(l => {
            const [lat, lon] = l.location;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
        });
        return [[minLat, minLon], [maxLat, maxLon]]
    }

    createBySegment(segment: string) {
        let t = new Tiler();
        let loc = locations;
        loc.locations.forEach((location) => {
            if (location.segments.includes(segment)) {
                let tinfo = new InfoBillboard(this.infoDialogOpenCallback, location.location[0], location.location[1]);
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
        this.companyObjects = new Array<InfoBillboard>();
    }


    selectBySegment(segment: string) {
        this.clearBillboards();
        this.createBySegment(segment);
    }

    centerCamera() {
        this.camera.position = this.cameraDefaultPosition.clone();
    }

    getZoomLevelForHeight(height: number, angle: number) {

        if (height < 0) {
            return -1;
        }
        if (height < 250 && angle > 75) {
            return 19;
        }
        else if (height < 400 && angle > 30) {
            return 18;
        }
        else if (height < 1400 && angle > 25) {
            return 17;
        }
        else if (height < 5000 && angle > 20) {
            return 16;
        } else if (height < 5000) {
            return 15;
        }
        else return -1;
    }

    getTileHeightForZoomLevel(zoomLevel: number) {
        if (zoomLevel == 19) {
            return 30;
        }
        else if (zoomLevel == 18) {
            return 28;
        } else if (zoomLevel == 17) {
            return 26;
        } else if (zoomLevel == 16) {
            return 24;
        } else if (zoomLevel == 15) {
            return 22;
        }
        return 0;
    }

    getForwardDistanceForZoomLevel(zoomLevel: number) {
        if (zoomLevel == 19) {
            return 450;
        }
        else if (zoomLevel == 18) {
            return 1000;
        } else if (zoomLevel == 17) {
            return 3000;
        } else if (zoomLevel == 16) {
            return 5200;
        } else if (zoomLevel == 15) {
            return 9000;
        }
        return 0;
    }

    getLateralDistanceForZoomLevel(zoomLevel: number) {
        if (zoomLevel == 19) {
            return 50;
        }
        else if (zoomLevel == 18) {
            return 550;
        } else if (zoomLevel == 17) {
            return 800;
        } else if (zoomLevel == 16) {
            return 1000;
        } else if (zoomLevel == 15) {
            return 3000;
        }
        return 0;
    }


    loadTiles() {
        let pos = this.camera.position;
        let forwardr = this.camera.getTarget().subtract(this.camera.position).normalize();
        let forward = forwardr.clone();
        forward.y = 0;
        forward = forward.normalize();
        let right = new BABYLON.Vector3(-forward.z, 0, forward.x).normalize();
        let dotProduct = BABYLON.Vector3.Dot(forward.normalize(), forwardr.normalize());

        // Get the angle in radians using arccos
        let angleRadians = Math.acos(dotProduct);
        let angleDegrees = BABYLON.Tools.ToDegrees(angleRadians);
        if (forwardr.y > 0) {
            angleDegrees *= -1;
        }
        let zoomLevel = this.getZoomLevelForHeight(pos.y, angleDegrees);
        if (zoomLevel > -1) {
            let lateralDist = this.getLateralDistanceForZoomLevel(zoomLevel);
            let forwardDist = this.getForwardDistanceForZoomLevel(zoomLevel);
            let l = pos.add(right.scale(lateralDist));
            let r = pos.subtract(right.scale(lateralDist));
            let f = pos.add(forward.scale(forwardDist));
            let b = pos.subtract(forward.scale(0.2 * forwardDist));
            let lx = this.globalConfig.offsetX - l.x;
            let ly = this.globalConfig.offsetY - l.z;
            let rx = this.globalConfig.offsetX - r.x;
            let ry = this.globalConfig.offsetY - r.z;
            let fx = this.globalConfig.offsetX - f.x;
            let fy = this.globalConfig.offsetY - f.z;
            let bx = this.globalConfig.offsetX - b.x;
            let by = this.globalConfig.offsetY - b.z;

            let minLat = Infinity;
            let maxLat = -Infinity;
            let minLon = Infinity;
            let maxLon = -Infinity;
            [lx, rx, fx, bx].forEach(l => {

                if (l < minLat) minLat = l;
                if (l > maxLat) maxLat = l;
            });

            [ly, ry, fy, by].forEach(l => {

                if (l < minLon) minLon = l;
                if (l > maxLon) maxLon = l;
            });
            let t = new Tiler();
            let minT = t.metersToTile(minLat, minLon, zoomLevel);
            let maxT = t.metersToTile(maxLat, maxLon, zoomLevel);
            for (var i = minT[0]; i < maxT[0] + 1; i++) {
                for (var j = minT[1]; j < maxT[1] + 1; j++) {
                    // if the tile exists, continue as it is already displayed
                    if (this.tileCache.get(i, j) != undefined) {
                        continue;
                    }
                    let td = new TileData("", this.globalConfig, new Tiler(), i, j, this.getTileHeightForZoomLevel(zoomLevel), zoomLevel);

                    td.setupTileBoundaryLines(this.scene);
                    this.tileCache.put(td);
                }
            }
        }
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
            if (time > 600) {
                __this.loadTiles();
                time = 0;
            }

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




