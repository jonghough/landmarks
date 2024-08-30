import "@babylonjs/core/Debug/debugLayer";
import * as BABYLON from "@babylonjs/core";
import {TileData} from "./TileData";
import {GlobalConfig} from "./GlobalConfig";
import {Tiler} from "./tiles";
import {InfoBillboard} from "./InfoBillboard";
import capitals from "./capitals.json";
import {TileCache} from "./TileCache";
import {ScreenText} from "./ScreenText";

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
  public capitalCityNames: Map<string, number[]> = new Map<string, number[]>();
  tileCache: TileCache = new TileCache(320);
  screenText: ScreenText;
  currentZoomLevel: number = 6;
  capitals: InfoBillboard[] = [];
  constructor(infoDialogOpenCallback: (title: string, text: string, homePage: string) => void) {
    this.globalConfig = new GlobalConfig(
      "s",
      12,
      1e7,
      true,
      1.0,
      2,
      15500000,
      4200000,
      true,
      35.685247972844635,
      139.75274474466545,
      (s) => {},
    );
    this.infoDialogOpenCallback = infoDialogOpenCallback;
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "landmarkCanvas";
    document.body.appendChild(canvas);

    var engine = new BABYLON.Engine(canvas, true);
    this.scene = new BABYLON.Scene(engine);
    this.scene.blockMaterialDirtyMechanism = true;
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1.0);
    this.camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 2, -25), this.scene);
    this.camera.maxZ = this.globalConfig.farPlaneDistance;

    this.camera.attachControl(canvas, true);
    var mainLight: BABYLON.HemisphericLight = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 10000, 0),
      this.scene,
    );
    mainLight.intensity = 1.0;
    this.camera.setTarget(BABYLON.Vector3.Zero());

    this.registerSceneUpdates();
    engine.runRenderLoop(() => {
      this.scene.render();
    });

    this.setCenterPosition();
    this.showCapitalCities();

    this.screenText = new ScreenText(this.globalConfig, () => {
      return this.getCameraPosition();
    });
  }

  getCameraPosition(): number[] | null {
    if (this.globalConfig.offsetSet) {
      var pos = this.camera.position;
      var pos3857x = this.globalConfig.offsetX - pos.x;
      var pos3857z = this.globalConfig.offsetY - pos.z;
      [pos3857x, pos3857z] = Tiler.wrapCoordinates(pos3857x, pos3857z);
      var lalo = new Tiler().metersToLalo(pos3857x, pos3857z);
      return [lalo[0], pos.y, lalo[1]];
    }
    return null;
  }

  setCenterPosition() {
    let lat = this.globalConfig.initialLatitude;
    let lon = this.globalConfig.initialLongitude;
    let t = new Tiler();
    let meters = t.laloToMeters(lat, lon);
    this.camera.position.x = this.globalConfig.offsetX - meters[0];
    this.camera.position.y = 500;
    this.camera.position.z = this.globalConfig.offsetY - meters[1] - 100;
    this.cameraDefaultPosition = this.camera.position.clone();
  }

  showCapitalCities() {
    let t = new Tiler();
    let cap = capitals;
    cap.forEach((location) => {
      let tinfo = new InfoBillboard(
        this.globalConfig,
        this.infoDialogOpenCallback,
        location.latitude,
        location.longitude,
      );
      let meters = t.laloToMeters(location.latitude, location.longitude);
      let ox = this.globalConfig.offsetX - meters[0];
      let oy = this.globalConfig.offsetY - meters[1];
      tinfo.createTileInfoBillboard(
        this.scene,
        new BABYLON.Vector3(ox, 1250, oy),
        location.capital,
        location.country,
        "",
      );
      tinfo.show("");
      this.capitals.push(tinfo);
      this.capitalCityNames.set(location.capital, [location.latitude, location.longitude]); //(location.capital + " (" + location.country + ")");
    });
  }

  getCapitalCityNames() {
    return capitals.map((c) => c.capital).sort();
  }

  clearBillboards() {
    this.companyObjects.forEach((t) => t.dispose());
    this.companyObjects = new Array<InfoBillboard>();
  }

  selectCapital(segment: string) {
    // TODO
    // 1. get the lat lon
    // 2. convert to  meters
    // 3. set offset equal to meters.
    // 4. update all capital cities
    // 5. move camera
    if (this.capitalCityNames.has(segment)) {
      let pos = this.capitalCityNames.get(segment);
      if (pos) {
        let t = new Tiler();
        let meters = t.laloToMeters(pos[0], pos[1]);
        this.globalConfig.offsetX = meters[0];
        this.globalConfig.offsetY = meters[1];

        this.capitals.forEach((c) => c.updatePosition());
        this.camera.position.x = 0;
        this.camera.position.z = 0;
      }
    }
  }

  centerCamera() {
    this.camera.position = this.cameraDefaultPosition.clone();
  }

  private updateOffsetsandZoomLevel() {
    let x = this.cameraDefaultPosition.x - this.camera.position.x;
    let y = this.cameraDefaultPosition.z - this.camera.position.z;
    let d = Math.sqrt(x * x + y * y);
    if (d > 1e5) {
      this.tileCache.clear();
      let kx = this.globalConfig.offsetX - this.camera.position.x;
      let ky = this.globalConfig.offsetY - this.camera.position.z;

      this.camera.position.x = this.cameraDefaultPosition.x;
      this.camera.position.z = this.cameraDefaultPosition.z;
      this.cameraDefaultPosition = this.camera.position.clone();

      this.globalConfig.offsetX = this.camera.position.x + kx;
      this.globalConfig.offsetY = this.camera.position.z + ky;
    }

    this.capitals.forEach((c) => c.updatePosition());
  }

  private getZoomLevelForHeight(height: number, angle: number) {
    if (height < 0) {
      return -1;
    }

    if (height < 300) {
      return 19;
    } else if (height < 500) {
      return 18;
    } else if (height < 800) {
      return 17;
    } else if (height < 1600) {
      return 16;
    } else if (height < 3000) {
      return 15;
    } else if (height < 5000) {
      return 14;
    } else if (height < 9000) {
      return 13;
    } else if (height < 16000) {
      return 12;
    } else if (height < 30000) {
      return 11;
    } else if (height < 55000) {
      return 10;
    } else if (height < 80000) {
      return 9;
    } else if (height < 150000) {
      return 8;
    } else if (height < 220000) {
      return 7;
    } else if (height < 400000) {
      return 6;
    } else if (height < 1000000) {
      return 5;
    } else return 4;
  }

  private getTileHeightForZoomLevel(zoomLevel: number) {
    let defaultHeight = 30;
    // in development, the idea was to place low level tiles below
    // higher level tiles. But that does not seem to be useful.
    const dropInHeight = 0;
    if (zoomLevel == 19) {
      return defaultHeight;
    } else if (zoomLevel == 18) {
      return defaultHeight - dropInHeight;
    } else if (zoomLevel == 17) {
      return defaultHeight - 2 * dropInHeight;
    } else if (zoomLevel == 16) {
      return defaultHeight - 3 * dropInHeight;
    } else if (zoomLevel == 15) {
      return defaultHeight - 4 * dropInHeight;
    } else if (zoomLevel == 14) {
      return defaultHeight - 5 * dropInHeight;
    } else if (zoomLevel == 13) {
      return defaultHeight - 6 * dropInHeight;
    } else if (zoomLevel == 12) {
      return defaultHeight - 7 * dropInHeight;
    } else if (zoomLevel == 11) {
      return defaultHeight - 8 * dropInHeight;
    } else if (zoomLevel == 10) {
      return defaultHeight - 9 * dropInHeight;
    } else if (zoomLevel == 9) {
      return defaultHeight - 10 * dropInHeight;
    } else if (zoomLevel == 8) {
      return defaultHeight - 11 * dropInHeight;
    } else if (zoomLevel == 7) {
      return defaultHeight - 12 * dropInHeight;
    } else if (zoomLevel == 6) {
      return defaultHeight - 13 * dropInHeight;
    } else if (zoomLevel == 5) {
      return defaultHeight - 14 * dropInHeight;
    } else if (zoomLevel == 4) {
      return defaultHeight - 15 * dropInHeight;
    }
    return 0;
  }

  private getForwardDistanceForZoomLevel(zoomLevel: number) {
    if (zoomLevel == 19) {
      return 1500;
    } else if (zoomLevel == 18) {
      return 2500;
    } else if (zoomLevel == 17) {
      return 5000;
    } else if (zoomLevel == 16) {
      return 10000;
    } else if (zoomLevel == 15) {
      return 20000;
    } else if (zoomLevel == 14) {
      return 46000;
    } else if (zoomLevel == 13) {
      return 75000;
    } else if (zoomLevel == 12) {
      return 150000;
    } else if (zoomLevel == 11) {
      return 220000;
    } else if (zoomLevel == 10) {
      return 450000;
    } else if (zoomLevel == 9) {
      return 800000;
    } else if (zoomLevel == 8) {
      return 2000000;
    } else if (zoomLevel == 7) {
      return 2500000;
    } else if (zoomLevel == 6) {
      return 4500000;
    } else if (zoomLevel == 5) {
      return 9900000;
    } else if (zoomLevel == 4) {
      return 20000000;
    }
    return 0;
  }

  private getLateralDistanceForZoomLevel(zoomLevel: number) {
    if (zoomLevel == 19) {
      return 300;
    } else if (zoomLevel == 18) {
      return 500;
    } else if (zoomLevel == 17) {
      return 800;
    } else if (zoomLevel == 16) {
      return 1500;
    } else if (zoomLevel == 15) {
      return 3000;
    } else if (zoomLevel == 14) {
      return 6000;
    } else if (zoomLevel == 13) {
      return 12000;
    } else if (zoomLevel == 12) {
      return 24000;
    } else if (zoomLevel == 11) {
      return 50000;
    } else if (zoomLevel == 10) {
      return 100000;
    } else if (zoomLevel == 9) {
      return 200000;
    } else if (zoomLevel == 8) {
      return 400000;
    } else if (zoomLevel == 7) {
      return 600000;
    } else if (zoomLevel == 6) {
      return 1200000;
    } else if (zoomLevel == 5) {
      return 2400000;
    } else if (zoomLevel == 4) {
      return 5000000;
    }
    return 0;
  }

  fetchTiles(minLat: number, minLon: number, maxLat: number, maxLon: number, zoomLevel: number) {
    let t = new Tiler();
    let minT = t.metersToTile(minLat, minLon, zoomLevel);
    let maxT = t.metersToTile(maxLat, maxLon, zoomLevel);
    // console.log("min and max  " + minT + ", " + maxT);
    // console.log("number " + ((maxT[0] - minT[0]) * (maxT[1] - minT[1])));
    if ((maxT[0] - minT[0]) * (maxT[1] - minT[1]) > 300) {
      return;
    }
    for (var i = minT[0]; i < maxT[0] + 1; i++) {
      for (var j = minT[1]; j < maxT[1] + 1; j++) {
        // if the tile exists, continue as it is already displayed
        if (this.tileCache.get(zoomLevel, i, j) != undefined) {
          continue;
        }
        let td = new TileData(
          "",
          this.globalConfig,
          new Tiler(),
          i,
          j,
          this.getTileHeightForZoomLevel(zoomLevel),
          zoomLevel,
        );

        td.setupTileBoundaryLines(this.scene);
        this.tileCache.put(zoomLevel, i, j, td);
      }
    }
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
    // console.log("height " + pos.y + ", angle " + angleDegrees);
    // console.log("zoom " + zoomLevel);
    let px = this.globalConfig.offsetX - pos.x;
    if (zoomLevel > -1) {
      let lateralDist = this.getLateralDistanceForZoomLevel(zoomLevel);
      let forwardDist = this.getForwardDistanceForZoomLevel(zoomLevel);
      let l = pos.add(right.scale(lateralDist));
      let r = pos.subtract(right.scale(lateralDist));
      let f = pos.add(forward.scale(forwardDist));
      let b = pos.subtract(forward.scale(0.2 * forwardDist));

      let lxn = Tiler.MIN_X;
      let rxn = Tiler.MIN_X;
      let bxn = Tiler.MIN_X;
      let fxn = Tiler.MIN_X;

      let lxm = Tiler.MAX_X;
      let rxm = Tiler.MAX_X;
      let bxm = Tiler.MAX_X;
      let fxm = Tiler.MAX_X;
      let lx = this.globalConfig.offsetX - l.x;
      let ly = this.globalConfig.offsetY - l.z;
      if (lx > Tiler.MAX_X && px < Tiler.MAX_X) {
        lxn = Tiler.wrapCoordinates(lx, ly)[0];
        lx = Tiler.MAX_X - 0.1;
      } else if (lx < Tiler.MAX_X && px > Tiler.MAX_X) {
        lxm = Tiler.wrapCoordinates(lx, ly)[0];
        lx = Tiler.MIN_X + 0.1;
      }
      [lx, ly] = Tiler.wrapCoordinates(lx, ly);
      let rx = this.globalConfig.offsetX - r.x;
      let ry = this.globalConfig.offsetY - r.z;
      if (rx > Tiler.MAX_X && px < Tiler.MAX_X) {
        rxn = Tiler.wrapCoordinates(rx, ry)[0];
        rx = Tiler.MAX_X - 0.1;
      } else if (rx < Tiler.MAX_X && px > Tiler.MAX_X) {
        rxm = Tiler.wrapCoordinates(rx, ry)[0];
        rx = Tiler.MIN_X + 0.1;
      }
      [rx, ry] = Tiler.wrapCoordinates(rx, ry);
      let fx = this.globalConfig.offsetX - f.x;
      let fy = this.globalConfig.offsetY - f.z;
      if (fx > Tiler.MAX_X && px < Tiler.MAX_X) {
        fxn = Tiler.wrapCoordinates(fx, fy)[0];
        fx = Tiler.MAX_X - 0.1;
      } else if (fx < Tiler.MAX_X && px > Tiler.MAX_X) {
        fxm = Tiler.wrapCoordinates(fx, fy)[0];
        fx = Tiler.MIN_X + 0.1;
      }
      [fx, fy] = Tiler.wrapCoordinates(fx, fy);
      let bx = this.globalConfig.offsetX - b.x;
      let by = this.globalConfig.offsetY - b.z;
      if (bx > Tiler.MAX_X && px < Tiler.MAX_X) {
        bxn = Tiler.wrapCoordinates(bx, by)[0];
        bx = Tiler.MAX_X - 0.1;
      } else if (bx < Tiler.MAX_X && px > Tiler.MAX_X) {
        bxm = Tiler.wrapCoordinates(fx, fy)[0];
        bx = Tiler.MIN_X + 0.1;
      }
      [bx, by] = Tiler.wrapCoordinates(bx, by);
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLon = Infinity;
      let maxLon = -Infinity;
      [lx, rx, fx, bx].forEach((l) => {
        if (l < minLat) minLat = l;
        if (l > maxLat) maxLat = l;
      });

      [ly, ry, fy, by].forEach((l) => {
        if (l < minLon) minLon = l;
        if (l > maxLon) maxLon = l;
      });
      let m = Math.max(lxn, rxn, fxn, bxn);
      let mm = Math.min(lxm, rxm, fxm, bxm);
      this.currentZoomLevel = zoomLevel;
      this.fetchTiles(minLat, minLon, maxLat, maxLon, zoomLevel);
      if (m > Tiler.MIN_X) {
        this.fetchTiles(Tiler.MIN_X + 0.1, minLon, m, maxLon, zoomLevel);
      }
      if (mm < Tiler.MAX_X) {
        this.fetchTiles(mm, minLon, Tiler.MAX_X, maxLon, zoomLevel);
      }
    }
  }

  refreshTiles(tileSet: string) {
    switch (tileSet) {
      case "Google Satellite":
        this.globalConfig.xyzTileSet = "s";
        break;
      case "Google Roadmap":
        this.globalConfig.xyzTileSet = "m";
        break;
      case "Google Hybrid":
        this.globalConfig.xyzTileSet = "y";
        break;
      default:
        break;
    }
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
          __this.moveLeft = true;
          break;

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

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

    var time = 0;
    var tt = 0;
    this.scene.registerBeforeRender(function () {
      let dt = __this.scene.getEngine().getDeltaTime();
      time += dt;
      tt += dt;
      if (tt > 500) {
        tt = 0;
        __this.tileCache.showAndHide(__this.currentZoomLevel, 0.9);
      }
      if (time > 1000) {
        __this.updateOffsetsandZoomLevel();
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
        forwardSpeed =
          __this.globalConfig.cameraForwardSpeed +
          0.000000001 * __this.camera.position.y * __this.camera.position.y;
      }
      if (__this.moveBackward) {
        forwardSpeed =
          -__this.globalConfig.cameraForwardSpeed -
          0.000000001 * __this.camera.position.y * __this.camera.position.y;
      }

      if (__this.moveRight) {
        lateralSpeed =
          __this.globalConfig.cameraLateralSpeed +
          0.000000001 * __this.camera.position.y * __this.camera.position.y;
      }

      if (__this.moveLeft) {
        lateralSpeed =
          -__this.globalConfig.cameraLateralSpeed -
          0.000000001 * __this.camera.position.y * __this.camera.position.y;
      }
      if (__this.moveUp) {
        upwardSpeed = __this.globalConfig.cameraForwardSpeed * 5;
      }
      var move = forward
        .scale(forwardSpeed * dt)
        .subtract(right.scale(lateralSpeed * dt))
        .add(up.scale(upwardSpeed * dt));

      __this.camera.position.x += move.x;
      __this.camera.position.y += move.y;
      __this.camera.position.z += move.z;

      __this.camera.setTarget(__this.camera.position.add(__this.camera.getForwardRay().direction));

      if (__this.camera.position.y < 60) {
        __this.camera.position.y = 60;
      }
      // ref: https://www.babylonjs-playground.com/#H6FZQ2#21
    });
  }
}
