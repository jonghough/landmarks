import type {TileData} from "./TileData";

/**
 * LRU Cache for TileData (tile images).
 *
 */
export class TileCache {
  cacheMap: Map<string, TileData> = new Map<string, TileData>();
  cacheList: TileData[] = [];
  tileCoords: Map<TileData, [number, number, number]> = new Map<
    TileData,
    [number, number, number]
  >();
  maxSize: number;

  /**
   * Initialzes the TileCache instance with  `maxSize` maximum number of
   * items allowed in the cache.
   * @param maxSize maximum number of items allowed in the cache.
   */
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Gets the TileData item for tile at position x/y/z.
   * @param z tile zoom level
   * @param x x value
   * @param y y value
   * @returns The tile data if it exists, else undefined.
   */
  get(z: number, x: number, y: number): TileData | undefined {
    const xyz = x + "/" + y + "/" + z;
    const tile = this.cacheMap.get(xyz);
    if (tile) {
      this.updateUsage(tile);
      return tile;
    }
    return undefined;
  }

  /**
   * Puts the given TileData item onto the cahce with the given
   * (x/y/z) values.
   * @param z tile zoom level
   * @param x x value
   * @param y y value
   * @param tile the tile to place on the cache.
   */
  put(z: number, x: number, y: number, tile: TileData): void {
    const xyz = x + "/" + y + "/" + z;
    if (this.cacheList.length >= this.maxSize) {
      this.evict();
    }

    const atile = this.cacheMap.get(xyz)!;
    if (!atile) {
      this.cacheMap.set(xyz, tile);
    }

    this.cacheList.push(tile);
    this.tileCoords.set(tile, [z, x, y]);
  }

  // updating the usage of the given tile
  private updateUsage(tile: TileData): void {
    const index = this.cacheList.indexOf(tile);
    if (index > -1) {
      this.cacheList.splice(index, 1);
      this.cacheList.push(tile);
    }
  }

  // Evict the least recently used tile
  private evict(): void {
    const lruTile = this.cacheList.shift();
    if (lruTile) {
      const [z, x, y] = this.tileCoords.get(lruTile)!;
      const tile = this.cacheMap.get(x + "/" + y + "/" + z)!;

      if (tile) {
        this.cacheMap.delete(x + "/" + y + "/" + z);
      }
      lruTile.delete();
      this.tileCoords.delete(lruTile);
    }
  }

  /**
   * Clears the cache completely.
   */
  clear() {
    this.tileCoords = new Map();
    this.cacheList.forEach((t) => t.delete());
    this.cacheList = [];
    this.cacheMap = new Map();
  }

  /**
   * Activate tiles at the given z-level
   * @param z zoom level
   */
  activateZLevel(z: number) {
    this.cacheList
      .filter((t) => t !== undefined)
      .forEach((t) => {
        t.xyzTileZoomLevel == z ? t.show() : t.hide();
      });
  }
  /**
   * Shows tiles at the given z-level and hides others, at a rate of v.
   * @param z zoom levle to show
   * @param v rate to show/hide tiles.
   */
  showAndHide(z: number, v: number) {
    this.cacheList
      .filter((t) => t !== undefined)
      .forEach((t) => {
        t.xyzTileZoomLevel == z ? t.showBy(v) : t.hideBy(v);
      });
  }
}
