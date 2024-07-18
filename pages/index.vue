<template>
  <div>
    <v-btn id="menu-activator" color="primary"> Companies </v-btn>
    <v-menu activator="#menu-activator">
      <v-list>
        <v-list-item
          v-for="(item, index) in items1"
          :key="index"
          :value="index"
          @click="clickSegment(item)"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn id="menu-activator2" color="primary" @click="centerCamera">
      Center Camera
    </v-btn>
    <v-menu activator="#menu-activator2">
      <v-list>
        <v-list-item
          v-for="(item, index) in xyzTileItems"
          :key="index"
          :value="index"
          @click="refreshTiles(item)"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn id="menu-activator3" color="primary" @click="centerCamera">
      Center Camera
    </v-btn>

    <v-btn id="menu-activator4" color="primary"> Operations </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { App } from "@/src/app";

let items1 = ref<string[]>(["Business Segments"]);
let xyzTileItems = ref<string[]>([
  "Google Satellite",
  "Google Roadmap",
  "Google Hybrid",
]);
let app: App | null = null;
onMounted(() => {
  app = new App();
  items1.value = Array.from(app.uniqueSegments);
});

function clickSegment(item: string) {
  app?.selectBySegment(item);
}

function centerCamera() {
  app?.centerCamera();
}

function refreshTiles(item: string) {
  app?.refreshTiles(item);
}
</script>
