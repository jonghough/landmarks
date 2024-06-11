import type { Tiler } from "./tiles";


class TileLocation {

    constructor(public latitude: number, public longitude: number, public zoom: number, public name: string) { }
}

export class TileMappings {

    public locationMap: Map<string, Array<TileLocation>> = new Map();
    constructor(public tiler: Tiler, public zoom: number) {

    }


    public addLocation(latitude: number, longitude: number, name: string) {
        let tile = this.tiler.laloToTile(latitude, longitude, this.zoom);
        let tileName = tile[0] + "/" + tile[1] + "/" + this.zoom;
        let arr = this.locationMap.get(tileName);
        if (arr == null) {
            this.locationMap.set(tileName, [new TileLocation(latitude, longitude, this.zoom, name)]);

        } else {
            arr.push(new TileLocation(latitude, longitude, this.zoom, name));
        }

    }
}