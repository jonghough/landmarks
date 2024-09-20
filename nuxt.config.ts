// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: process.env.NODE_ENV === "production" ? "/landmarks/" : "/",
  },
  devtools: { enabled: true },
  css: ["vuetify/lib/styles/main.sass"],
  build: {
    transpile: ["vuetify", /@vue[\\/]composition-api/],
  },
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },
});
