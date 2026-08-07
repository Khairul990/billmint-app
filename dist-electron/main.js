import { app as o, BrowserWindow as r } from "electron";
import i from "path";
import { fileURLToPath as a } from "url";
const l = a(import.meta.url), n = i.dirname(l);
let e;
function t() {
  e = new r({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: !1,
    autoHideMenuBar: !0,
    titleBarStyle: "hidden",
    // Make it look like a modern app
    titleBarOverlay: {
      color: "#0A0A0A",
      symbolColor: "#F8FAFC"
    },
    webPreferences: {
      nodeIntegration: !0,
      contextIsolation: !1
    },
    icon: i.join(n, "../public/icons/icon-512x512.png")
  }), process.env.VITE_DEV_SERVER_URL ? e.loadURL(process.env.VITE_DEV_SERVER_URL) : e.loadFile(i.join(n, "../dist/index.html")), e.once("ready-to-show", () => {
    e.show();
  });
}
o.whenReady().then(() => {
  t(), o.on("activate", () => {
    r.getAllWindows().length === 0 && t();
  });
});
o.on("window-all-closed", () => {
  process.platform !== "darwin" && o.quit();
});
