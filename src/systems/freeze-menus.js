// Manages visbility of the freeze-menus (which have the freeze-menu) CSS class
AFRAME.registerSystem("freeze-menus", {
  init() {
    let prevMenu = null;

    document.querySelector("#cursor").addEventListener("raycaster-intersection", e => {
      let menuContainer = e.detail.el;
      if (!menuContainer) return;

      let menu = menuContainer.querySelector(".freeze-menu");

      while (menuContainer && !menu) {
        menuContainer = menuContainer.parentNode;
        menu = menuContainer.querySelector(".freeze-menu");
      }

      if (!menu || !menu.components["visibility-while-frozen"]) return;
      if (prevMenu && prevMenu !== menu && prevMenu.components["visibility-while-frozen"]) {
        prevMenu.components["visibility-while-frozen"].data.visible = null;
      }

      prevMenu = menu;
      menu.components["visibility-while-frozen"].data.visible = true;
    });
  }
});
