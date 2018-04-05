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

    var intel_name = "Intel Graphics";
    this.intel = new PopupMenu.PopupMenuItem(intel_name);
    this.intel.setting = false;
    this.intel.connect('activate', (item, event) => {
        this.graphics_activate(item, intel_name, "intel");
    });
    this.powerMenu.addMenuItem(this.intel, 0);

    var nvidia_name = "NVIDIA Graphics";
    this.nvidia = new PopupMenu.PopupMenuItem(nvidia_name);
    this.nvidia.setting = false;
    this.nvidia.connect('activate', (item, event) => {
        this.graphics_activate(item, nvidia_name, "nvidia");
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

function graphics_activate(item, name, vendor) {
    var extension = this;
    if (!item.setting) {
        item.setting = true;

        let dialog = extension.setting_dialog("Switching to " + name + " on next reboot...");
        dialog.open();

        extension.set_graphics(vendor, function(pid, status) {
            GLib.spawn_close_pid(pid);

            item.setting = false;

            if (status == 0) {
                dialog.label.set_text("Reboot to use " + name);

                dialog.setButtons([{
                    action: function() {
                        dialog.close();
                    },
                    label: "Close",
                    key: Clutter.Escape
                }, {
                    action: function() {
                        dialog.close();
                        extension.reboot();
                    },
                    label: "Reboot",
                    key: Clutter.Enter
                }]);
            } else {
                dialog.label.set_text("Failed to switch to " + name);

                dialog.setButtons([{
                    action: function() {
                        dialog.close();
                    },
                    label: "Close",
                    key: Clutter.Escape
                }]);
            }
        });
    }
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

function setting_dialog(text) {
    var dialog = new ModalDialog.ModalDialog({
        styleClass: "run-dialog"
    });

    dialog.label = new St.Label({
        style_class: "run-dialog-label",
        text: text
    });

    dialog.contentLayout.add(dialog.label, {
        x_fill: false,
        x_align: St.Align.START,
        y_align: St.Align.START
    });

    return dialog;
}

function reboot(name) {
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
