

/**
 * See ref: https://github.com/OSGeo/gdal/blob/7f2dcdc930b51f6cf5f013cd4d5ef66ff094239f/gdal/swig/python/scripts/gdal2tiles.py
 */

export class Tiler {
    static readonly MIN_X = -20037508.342789244;
    static readonly MAX_X = 20037508.342789244;
    static readonly MIN_Y = -20037508.342789244;
    static readonly MAX_Y = 20037508.342789244;
    static readonly RANGE_X = Tiler.MAX_X - Tiler.MIN_X;
    static readonly RANGE_Y = Tiler.MAX_Y - Tiler.MIN_Y;
    originShift: number;
    initialResolution: number;
    tileSize: number;
    constructor() {
        this.tileSize = 256;
        const WGS84EllipsoidRadius = 6378137; // semi-major axis
        this.originShift = 2 * Math.PI * WGS84EllipsoidRadius / 2.0;
        this.initialResolution = 2 * Math.PI * WGS84EllipsoidRadius / this.tileSize;

    }


    /**
     * Converts latitude, longitude coordiantes to meters, using the EPSG:3857 CRS.
     * @param lat Latitude
     * @param lon Longitude
     * @returns EPSG:3857 meters
     */
    laloToMeters(lat: number, lon: number): Array<number> {
        let x = lon * this.originShift / 180.0;
        let y = Math.log(Math.tan((90 + lat) * Math.PI / 360.0)) / (Math.PI / 180.0);
        y = y * this.originShift / 180.0;
        return [x, y]
    }

    /**
     * Converts EPSG:3857 encoded meter coordinates to EPSG:4326 latitude,longitude coordinates.
     * @param x latitude equivalent coordiante
     * @param y longitude equivalent coordiante
     * @returns EPSG:4326 encoded latitud, longitude coordinates.
     */
    metersToLalo(x: number, y: number): Array<number> {
        let lon = (x / this.originShift) * 180.0;
        let lat = (y / this.originShift) * 180.0;
        lat = (180.0 / Math.PI) * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2);
        return [lat, lon];
    }

    /**
     * Converts pixel-space values to EPSG:3857 encoded coordinates based on the given resolution,
     * and zoom level.
     * @param px pixel x-coordinate
     * @param py pixel y-coordinate
     * @param zoom zoom level
     * @returns EPSG:3857 encoded x,y values.
     */
    pixelsToMeters(px: number, py: number, zoom: number) {
        let res = this.resolution(zoom);
        let x = px * res - this.originShift;
        let y = py * res - this.originShift;
        return [x, y];
    }

    /**
     * Converts EPSG:3857 encoded coordinates to pixel-space coordinates, for the
     * given resolution, and given zoom level.
     * @param x x coordinate
     * @param y y coordinate
     * @param zoom zoom level
     * @returns pixel-space x,y values.
     */
    metersToPixels(x: number, y: number, zoom: number) {
        let res = this.resolution(zoom);
        let px = (x + this.originShift) / res;
        let py = (y + this.originShift) / res;
        return [px, py];
    }


    resolution(zoom: number) {
        return this.initialResolution / (Math.pow(2, zoom));
    }

    /**
     * Gets the slippy tile value (unique x/y values) for the given pixel-space
     * x and y values.
     * @param px pixel-space x value
     * @param py pixel-space y value
     * @returns a unique reference to a tile specified by the x and y values of the slippy tiling scheme.
     */
    pixelsToTile(px: number, py: number) {
        let tx = Math.ceil(px / this.tileSize) - 1;
        let ty = Math.ceil(py / this.tileSize) - 1;
        return [tx, ty];
    }

    /**
     * Gets a unique tile reference, specified by x/y values of the slippy tiling scheme,
     * for the given EPSG:4326 latitude, longitude coordinates.
     * @param lat latitude
     * @param lon longitude
     * @param zoom zoom level.
     * @returns  a unique reference to a tile specified by the x and y values of the slippy tiling scheme.
     */
    laloToTile(lat: number, lon: number, zoom: number) {
        let meters = this.laloToMeters(lat, lon);
        let tile = this.metersToTile(meters[0], meters[1], zoom);
        return tile;
    }

    /**
     * Gets a unique tile reference, specified by x/y values of the slippy tiling scheme,
     * for the given EPSG:3857 x, y coordinates.
     * @param x x coordinate
     * @param y y coordinate
     * @param zoom zoom level.
     * @returns  a unique reference to a tile specified by the x and y values of the slippy tiling scheme.
     */
    metersToTile(x: number, y: number, zoom: number) {
        let pixels = this.metersToPixels(x, y, zoom);
        return this.pixelsToTile(pixels[0], pixels[1]);
    }

    /**
     * Gets the coordinates of the two tile boundary points (upper left, and lower right) that
     * specify a given tile, at the given zoom level. 
     * @param tx Tile x value
     * @param ty Tile y value
     * @param zoom zoom level
     * @returns array of 4 coordinates representing the upper-left, and lower-right coordinates of the tile boundary
     * in EPSG:3857 CRS.
     */
    tileBoundsin3857(tx: number, ty: number, zoom: number) {
        let minXY = this.pixelsToMeters(tx * this.tileSize, ty * this.tileSize, zoom);
        let maxXY = this.pixelsToMeters((tx + 1) * this.tileSize, (ty + 1) * this.tileSize, zoom);
        return [minXY[0], minXY[1], maxXY[0], maxXY[1]];
    }

    /**
     * Gets the coordinates of the two tile boundary points (upper left, and lower right) that
     * specify a given tile, at the given zoom level. 
     * @param tx Tile x value
     * @param ty Tile y value
     * @param zoom zoom level
     * @returns array of 4 coordinates representing the upper-left, and lower-right coordinates of the tile boundary
     * in EPSG:4326 CRS.
     */
    tileBoundsIn4326(tx: number, ty: number, zoom: number) {
        let bounds = this.tileBoundsin3857(tx, ty, zoom);
        let minLaLo = this.metersToLalo(bounds[0], bounds[1]);
        let maxLaLo = this.metersToLalo(bounds[2], bounds[3]);
        return [minLaLo[0], minLaLo[1], maxLaLo[0], maxLaLo[1]];
    }


    /**
     * Gets the EPSG:4326 CRS encoded tile bounds (for upper left, lower right coordinates) for the tile containing the given
     * latitude and longitude coordinate, at the given zoom level.
     * @param lat latitude
     * @param lon longitude
     * @param zoom zoom level
     * @returns Tile boundary coordinates array for the given (lat,lon) coordinate.
     */
    laloToTileBounds4326(lat: number, lon: number, zoom: number) {
        let tile = this.laloToTile(lat, lon, zoom);
        return this.tileBoundsIn4326(tile[0], tile[1], zoom);
    }

    /**
    * Gets the EPSG:3857 CRS encoded tile bounds (for upper left, lower right coordinates) for the tile containing the given
    * latitude and longitude coordinate, at the given zoom level.
    * @param lat latitude
    * @param lon longitude
    * @param zoom zoom level
    * @returns Tile boundary coordinates (in EPSG:3857) array for the given (lat,lon) coordinate.
    */
    laloToTileBounds3857(lat: number, lon: number, zoom: number) {
        let tile = this.laloToTile(lat, lon, zoom);
        return this.tileBoundsin3857(tile[0], tile[1], zoom);
    }

    /**
     * Converts the tiling scheme from default to slippy (inverted y values, basically).
     * @param tx x value of the default tiling scheme
     * @param ty y value of the default tiling scheme
     * @param zoom 
     * @returns 
     */
    toSlippy(tx: number, ty: number, zoom: number) {
        return [tx, Math.pow(2, zoom) - ty - 1];
    }

    offsetMeters(x: number, y: number) {
        return [x, y];
    }

    static wrapCoordinates(x: number, y: number): [number, number] {

        // Wrap x (longitude) within the [MIN_X, MAX_X] range
        let wrappedX = ((x - Tiler.MIN_X) % Tiler.RANGE_X + Tiler.RANGE_X) % Tiler.RANGE_X + Tiler.MIN_X;

        // Clamp y (latitude) within the [MIN_Y, MAX_Y] range, since Y does not wrap in EPSG:3857
        let clampedY = Math.max(Tiler.MIN_Y, Math.min(Tiler.MAX_Y, y));

        return [wrappedX, clampedY];
    }

}