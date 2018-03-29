const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Ornament = imports.ui.popupMenu.Ornament;
const Util = imports.misc.util;

function init() {}

function enable() {

    this.powerMenu = Main.panel.statusArea['aggregateMenu']._power._item.menu;

    this.graphics_separator = new PopupMenu.PopupSeparatorMenuItem();
    this.powerMenu.addMenuItem(this.graphics_separator, 0);

    this.intel = new PopupMenu.PopupMenuItem("Intel");
    this.intel.connect('activate', (item, event) => {
        global.log(event);
        this.reset_graphics_ornament();
        this.set_graphics("intel");
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.intel, 0);

    this.nvidia = new PopupMenu.PopupMenuItem("NVIDIA");
    this.nvidia.connect('activate', (item, event) => {
        global.log(event);
        this.reset_graphics_ornament();
        this.set_graphics("nvidia");
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.nvidia, 0);

    this.profile_separator = new PopupMenu.PopupSeparatorMenuItem();
    this.powerMenu.addMenuItem(this.profile_separator, 0);

    this.battery = new PopupMenu.PopupMenuItem("Battery Life");
    this.battery.connect('activate', (item, event) => {
        global.log(event);
        this.reset_profile_ornament();
        this.set_profile("battery");
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.battery, 0);

    this.balanced = new PopupMenu.PopupMenuItem("Balanced");
    this.balanced.connect('activate', (item, event) => {
        this.reset_profile_ornament();
        this.set_profile("balanced");
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.balanced, 0);

    this.performance = new PopupMenu.PopupMenuItem("High Performance");
    this.performance.connect('activate', (item, event) => {
        this.reset_profile_ornament();
        this.set_profile("performance");
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.performance, 0);

    this.reset_graphics_ornament();
    var graphics = this.get_graphics();
    if (graphics === "intel") {
        this.intel.setOrnament(Ornament.DOT);
    } else if (graphics === "nvidia") {
        this.nvidia.setOrnament(Ornament.DOT);
    }

    this.reset_profile_ornament();
    this.balanced.setOrnament(Ornament.DOT);
}

function get_graphics() {
    var [res, stdout, stderr, status] = GLib.spawn_sync(
        null,
        ["system76-power", "graphics"],
        null,
        GLib.SpawnFlags.SEARCH_PATH,
        null,
        null
    );

    global.log(res, stdout, stderr, status)

    return String(stdout).trim();
}

function set_graphics(graphics) {
    //TODO Util.trySpawn(["system76-power", "graphics", graphics]);
}

function reset_graphics_ornament() {
    this.nvidia.setOrnament(Ornament.NONE);
    this.intel.setOrnament(Ornament.NONE);
}

function set_profile(profile) {
    Util.trySpawn(["system76-power", profile]);
}

function reset_profile_ornament() {
    this.performance.setOrnament(Ornament.NONE);
    this.balanced.setOrnament(Ornament.NONE);
    this.battery.setOrnament(Ornament.NONE);
}

function disable() {
    if (this.performance) {
        this.performance.destroy();
        this.performance = 0;
    }

    if (this.balanced) {
        this.balanced.destroy();
        this.balanced = 0;
    }

    if (this.battery) {
        this.battery.destroy();
        this.battery = 0;
    }

    if (this.profile_separator) {
        this.profile_separator.destroy();
        this.profile_separator = 0;
    }

    if (this.nvidia) {
        this.nvidia.destroy();
        this.nvidia = 0;
    }

    if (this.intel) {
        this.intel.destroy();
        this.intel = 0;
    }

    if (this.graphics_separator) {
        this.graphics_separator.destroy();
        this.graphics_separator = 0;
    }
}
