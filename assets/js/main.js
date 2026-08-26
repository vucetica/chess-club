// Single entry point for every page.
import { initSite } from "./site.js";
import { mountWidgets } from "./widgets/mount.js";

initSite();
mountWidgets();
