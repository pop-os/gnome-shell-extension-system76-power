const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Lang = imports.lang;

const Util = imports.misc.util;

const Main = imports.ui.main;
const ModalDialog = imports.ui.modalDialog;
const PopupMenu = imports.ui.popupMenu;
const Ornament = imports.ui.popupMenu.Ornament;

const PowerDaemon = Gio.DBusProxy.makeProxyWrapper(
'<node>\
  <interface name="com.system76.PowerDaemon">\
    <method name="Performance"/>\
    <method name="Balanced"/>\
    <method name="Battery"/>\
    <method name="GetGraphics">\
      <arg name="vendor" type="s" direction="out"/>\
    </method>\
    <method name="SetGraphics">\
      <arg name="vendor" type="s" direction="in"/>\
    </method>\
    <method name="GetGraphicsPower">\
      <arg name="power" type="b" direction="out"/>\
    </method>\
    <method name="SetGraphicsPower">\
      <arg name="power" type="b" direction="in"/>\
    </method>\
    <method name="AutoGraphicsPower"/>\
    <signal name="HotPlugDetect">\
      <arg name="port" type="t"/>\
    </signal>\
  </interface>\
</node>'
);

function init() {}

var switched = false;
var notified = false;

var PopDialog = new Lang.Class({
    Name: "PopDialog",
    Extends: ModalDialog.ModalDialog,

    _init(icon, title, description, params) {
        this.parent(params);

        this.set_icon(icon);
        this.set_label(title);
        this.set_description(description);

        this.descriptionBox = new St.BoxLayout({ vertical: true });
        this.descriptionBox.add(this.label);
        this.descriptionBox.add(this.description);

        this.container = new St.BoxLayout({ vertical: false });
        this.container.add(this.icon);
        this.container.add(this.descriptionBox);

        this.contentLayout.add(this.container);
    },

    update(icon, title, description) {
        this.icon.icon_name = icon;
        this.label.text = title;
        this.description.text = description;
    },

    set_description(description) {
        this.description = new St.Label({
            style_class: "end-session-dialog-description",
            text: description,
        });
    },

    set_label(title) {
        this.label = new St.Label({
            style_class: "end-session-dialog-subject",
            text: title,
            x_align: St.Align.START,
            y_align: St.Align.START,
        });
    },

    set_icon(icon) {
        this.icon = new St.Icon({
            icon_name: icon,
            icon_size: 48,
            style_class: "pop-dialog-icon"
        });
    }
});

var PopupGraphicsMenuItem = new Lang.Class({
  Name: "PopupGraphicsMenuItem",
  Extends: PopupMenu.PopupBaseMenuItem,

  _init(title, text, params) {
    this.parent(params);
    this.box = new St.BoxLayout({ vertical: true });
    this.label = new St.Label({
        style_class: "pop-menu-title",
        text: title,
    });

    this.description = new St.Label({
        style_class: "pop-menu-description",
        text: "",
    });

    if (text != null) {
       this.description.text = text;
    } else {
       this.description.hide();
    }

    this.box.add_child(this.label);
    this.box.add_child(this.description);
    this.actor.add_child(this.box);
    this.actor.label_actor = this.box;
  },

  setDescription(description) {
      this.description.text = description;
      this.description.show();
  },

  hideDescription() {
      this.description.hide();
  }
});

function enable() {
    this.bus = new PowerDaemon(Gio.DBus.system, 'com.system76.PowerDaemon', '/com/system76/PowerDaemon');

    this.powerMenu = Main.panel.statusArea['aggregateMenu']._power._item.menu;

    try {
        var graphics = this.bus.GetGraphicsSync();

        this.graphics_separator = new PopupMenu.PopupSeparatorMenuItem();
        this.powerMenu.addMenuItem(this.graphics_separator, 0);

        var intel_text, nvidia_text;
        if (graphics == "intel") {
            intel_text = null;
            nvidia_text = "Enable for external displays.\nRequires restart.";
        } else {
            intel_text = "Disables external displays.\nRequires restart.";
            nvidia_text = null;
        }

        var intel_name = "Intel";
        this.intel = new PopupGraphicsMenuItem(intel_name + " Graphics", intel_text);
        this.intel.setting = false;
        this.intel.connect('activate', (item, event) => {
            this.graphics_activate(item, intel_name, "intel");
        });
        this.powerMenu.addMenuItem(this.intel, 0);

        var nvidia_name = "NVIDIA";
        this.nvidia = new PopupGraphicsMenuItem(nvidia_name + " Graphics", nvidia_text);
        this.nvidia.setting = false;
        this.nvidia.connect('activate', (item, event) => {
            this.graphics_activate(item, nvidia_name, "nvidia");
        });
        this.powerMenu.addMenuItem(this.nvidia, 0);

        this.reset_graphics_ornament();
        if (graphics == "intel") {
            this.intel.setOrnament(Ornament.DOT);
        } else if (graphics == "nvidia") {
            this.nvidia.setOrnament(Ornament.DOT);
        }

        var extension = this;
        this.bus.connectSignal("HotPlugDetect", function(proxy) {
            var graphics = proxy.GetGraphicsSync();
            if (graphics != "nvidia") {
                extension.hotplug(extension.nvidia, nvidia_name, "nvidia");
            }
        });
    } catch (error) {
        global.log(error);
    }

    this.profile_separator = new PopupMenu.PopupSeparatorMenuItem();
    this.powerMenu.addMenuItem(this.profile_separator, 0);

    this.battery = new PopupMenu.PopupMenuItem("Battery Life");
    this.battery.connect('activate', (item, event) => {
        global.log(event);
        this.reset_profile_ornament();
        this.bus.BatteryRemote(function() {
            item.setOrnament(Ornament.DOT);
        });
    });
    this.powerMenu.addMenuItem(this.battery, 0);

    this.balanced = new PopupMenu.PopupMenuItem("Balanced");
    this.balanced.connect('activate', (item, event) => {
        this.reset_profile_ornament();
        this.bus.BalancedRemote(function() {
            item.setOrnament(Ornament.DOT);
        });
    });
    this.powerMenu.addMenuItem(this.balanced, 0);

    this.performance = new PopupMenu.PopupMenuItem("High Performance");
    this.performance.connect('activate', (item, event) => {
        this.reset_profile_ornament();
        this.bus.PerformanceRemote(function() {
            item.setOrnament(Ornament.DOT);
        });
    });
    this.powerMenu.addMenuItem(this.performance, 0);

    this.reset_profile_ornament();
    this.balanced.setOrnament(Ornament.DOT);
}

function hotplug(item, name, vendor) {
    var extension = this;
    if (switched || notified) {
      return;
    }

    notified = true;
    let dialog = new PopDialog(
        "video-display-symbolic",
        "Switch to " + name + " to use external displays",
        "External displays are connected to the NVIDIA card.\nSwitch to NVIDIA graphics to use them.",
    );
    dialog.open();

    dialog.setButtons([{
        action: function() {
            dialog.close();
        },
        label: "Continue using " + name,
        key: Clutter.Escape
    }, {
        action: function() {
            dialog.close();
            extension.graphics_activate(item, name, vendor);
        },
        label: "Switch to " + name,
        key: Clutter.Enter
    }]);
}

function graphics_activate(item, name, vendor) {
    switched = true;
    var extension = this;
    if (!item.setting) {
        item.setting = true;

        let dialog = new PopDialog(
            "dialog-warning-symbolic",
            "Preparing to Switch to " + name + " Graphics",
            name + " graphics will be enabled on the next restart",
        );
        dialog.open();

        extension.bus.SetGraphicsRemote(vendor, function(result, error) {
            item.setting = false;

            if (error == null) {
                dialog.update(
                    "system-restart-symbolic",
                    "Restart to Switch to " + name + " Graphics",
                    "Switching to " + name + " will close all open apps and restart your device.\nYou may lose any unsaved work."
                );
                var reboot_msg = "Will be enabled on\nthe next restart.";
                if (name == "intel") {
                    extension.intel.setDescription(reboot_msg);
                    extension.nvidia.hideDescription();
                } else {
                    extension.nvidia.setDescription(reboot_msg);
                    extension.intel.hideDescription();
                }

                dialog.setButtons([{
                    action: function() {
                        dialog.close();
                    },
                    label: "Restart Later",
                    key: Clutter.Escape
                }, {
                    action: function() {
                        dialog.close();
                        extension.reboot();
                    },
                    label: "Restart and Switch",
                    key: Clutter.Enter
                }]);
            } else {
                global.log(error);

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

function reboot(name) {
    Util.trySpawn(["gnome-session-quit", "--reboot"]);
}

function reset_graphics_ornament() {
    this.nvidia.setOrnament(Ornament.NONE);
    this.intel.setOrnament(Ornament.NONE);
}

function reset_profile_ornament() {
    this.performance.setOrnament(Ornament.NONE);
    this.balanced.setOrnament(Ornament.NONE);
    this.battery.setOrnament(Ornament.NONE);
}

function disable() {
    if (this.performance) {
        this.performance.destroy();
        this.performance = null;
    }

    if (this.balanced) {
        this.balanced.destroy();
        this.balanced = null;
    }

    if (this.battery) {
        this.battery.destroy();
        this.battery = null;
    }

    if (this.profile_separator) {
        this.profile_separator.destroy();
        this.profile_separator = null;
    }

    if (this.nvidia) {
        this.nvidia.destroy();
        this.nvidia = null;
    }

    if (this.intel) {
        this.intel.destroy();
        this.intel = null;
    }

    if (this.graphics_separator) {
        this.graphics_separator.destroy();
        this.graphics_separator = null;
    }

    if (this.bus) {
        this.bus = null;
    }
}
