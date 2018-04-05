const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const St = imports.gi.St;

const Util = imports.misc.util;

const Main = imports.ui.main;
const ModalDialog = imports.ui.modalDialog;
const PopupMenu = imports.ui.popupMenu;
const Ornament = imports.ui.popupMenu.Ornament;

function init() {}

function enable() {
    this.powerMenu = Main.panel.statusArea['aggregateMenu']._power._item.menu;

    this.graphics_separator = new PopupMenu.PopupSeparatorMenuItem();
    this.powerMenu.addMenuItem(this.graphics_separator, 0);

    this.intel = new PopupMenu.PopupMenuItem("Intel Graphics");
    this.intel.setting = false;
    this.intel.connect('activate', (item, event) => {
        global.log(event);
        if (!item.setting) {
            this.reset_graphics_ornament();
            item.setting = this.setting_dialog();
            item.setting.open();
            var reboot = this.reboot;
            this.set_graphics("intel", function(pid, status) {
                GLib.spawn_close_pid(pid);
                item.setting.close();
                item.setting = false;
                if (status == 0) {
                    reboot();
                }
            });
        }
    });
    this.powerMenu.addMenuItem(this.intel, 0);

    this.nvidia = new PopupMenu.PopupMenuItem("NVIDIA Graphics");
    this.nvidia.setting = false;
    this.nvidia.connect('activate', (item, event) => {
        global.log(event);
        if (!item.setting) {
            this.reset_graphics_ornament();
            item.setting = this.setting_dialog();
            item.setting.open();
            var reboot = this.reboot;
            this.set_graphics("nvidia", function(pid, status) {
                GLib.spawn_close_pid(pid);
                item.setting.close();
                item.setting = false;
                if (status == 0) {
                    reboot();
                }
            });
        }
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

function set_graphics(graphics, callback) {
    var [res, child_pid] = GLib.spawn_async(
        null,
        ["pkexec", "system76-power", "graphics", graphics],
        null,
        GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
        null
    );

    GLib.child_watch_add(
        null,
        child_pid,
        callback,
    );
}

function setting_dialog() {
    var dialog = new ModalDialog.ModalDialog({
        styleClass: "run-dialog"
    });

    let label = new St.Label({
        style_class: "run-dialog-label",
        text: "Switching graphics mode..."
    });

    dialog.contentLayout.add(label, {
        x_fill: false,
        x_align: St.Align.START,
        y_align: St.Align.START
    });

    dialog.setButtons([{
        action: dialog.close.bind(dialog),
        label: "Close",
        key: Clutter.Escape
    }]);

    return dialog;
}

function reboot() {
    Util.trySpawn(["gnome-session-quit", "--reboot"]);
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
