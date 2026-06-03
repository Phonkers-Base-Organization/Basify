import { defineConfig, createLogger } from "vite";

const customLogger = createLogger();
const loggerWarn = customLogger.warn;

customLogger.warn = (msg, options) => {
  if (msg.includes("build.outDir must not be the same directory")) return;
  loggerWarn(msg, options);
};

export default defineConfig({
  customLogger,
  build: {
    lib: {
      entry: "src/index.js",
      formats: ["iife"],
      name: "Basify",
      fileName: () => "Basify.js",
    },
    outDir: "..",
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "Spicetify.React",
          "react-dom": "Spicetify.ReactDOM",
        },
      },
    },
  },
});
