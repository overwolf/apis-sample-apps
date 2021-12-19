document.querySelector('.app-header').addEventListener('mousedown', () => {
  overwolf.windows.getCurrentWindow(result => {
    if (result.success && result.window && result.window.id) {
      overwolf.windows.dragMove(result.window.id, null);
    }
  });
});

document.querySelector('.window-control').addEventListener('mousedown', e => {
  e.stopPropagation();
});

document.querySelector('.window-control.maximize')?.addEventListener('click', () => {
  overwolf.windows.getCurrentWindow(result => {
    if (result.success && result.window && result.window.id) {
      if (result.window.stateEx === 'maximized') {
        overwolf.windows.restore(result.window.id, null);
      } else {
        overwolf.windows.maximize(result.window.id, null);
      }
    }
  });
});

document.querySelector('.window-control.minimize').addEventListener('click', () => {
  overwolf.windows.getCurrentWindow(result => {
    if (result.success && result.window && result.window.id) {
      overwolf.windows.minimize(result.window.id, null);
    }
  });
});

document.querySelector('.window-control.close').addEventListener('click', () => {
  overwolf.windows.obtainDeclaredWindow('background', result => {
    if (result.success && result.window && result.window.id) {
      overwolf.windows.close(result.window.id, null);
    }
  });
});
