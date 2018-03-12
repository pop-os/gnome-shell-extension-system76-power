const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Ornament = imports.ui.popupMenu.Ornament;

function init() {}

function enable() {
    
    this.powerMenu = Main.panel.statusArea['aggregateMenu']._power._item.menu;
    
    this.separator = new PopupMenu.PopupSeparatorMenuItem();
    this.powerMenu.addMenuItem(this.separator, 0);
    
    this.battery = new PopupMenu.PopupMenuItem("Battery Life");
    this.battery.connect('activate', (item, event) => {
        global.log(event);
        this.reset_ornament();
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.battery, 0);
    
    this.balanced = new PopupMenu.PopupMenuItem("Balanced");
    this.balanced.connect('activate', (item, event) => {
        this.reset_ornament();
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.balanced, 0);
    
    this.performance = new PopupMenu.PopupMenuItem("High Performance");
    this.performance.connect('activate', (item, event) => {
        this.reset_ornament();
        item.setOrnament(Ornament.DOT);
    });
    this.powerMenu.addMenuItem(this.performance, 0);
    
    this.reset_ornament();
    this.balanced.setOrnament(Ornament.DOT);
}

function reset_ornament() {
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
    
    if (this.separator) {
        this.separator.destroy();
        this.separator = 0;
    }
}
