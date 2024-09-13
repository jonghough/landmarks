# Landmarks - 3D traversible world

Traverse images of the Earth from various tile servers (Google, OSM) and move around in 3D space.
![Screenshot 1](/img/landmark1.png)

## Technology used to create the app

- BablyonJS
- Vue 3
- Nuxt 3
- Vuetify

## Tiling

Various xyz tiles are able to be used as a background tiling scheme. By default Google Terrain tiles are used.

## Locations

Country, and territory capital cities are marked on the map and can be teleported to. The cities and locaitons are taken from

[Lat/Lon sources](https://gist.github.com/ofou/df09a6834a8421b4f376c875194915c9)

## Details

Given the users location (latitude, longitude), the app will load and cache xyz tile images for the surrounding area. As the user moves around the world, new tiles are downloaded, and older tiles may be evicted from the cache (LRU cache).
The tile level is decided by the elevation of the user. Higher elevation will cause the app to download lower zoom level images (i.e. low resolution)

### Running

Example using yarn.

```
yarn install
```

```
yarn run dev
```

### Screenshots

![Screenshot 2](/img/landmark2.png)
![Screenshot 3](/img/landmark3.png)
![Screenshot 4](/img/landmark4.png)
