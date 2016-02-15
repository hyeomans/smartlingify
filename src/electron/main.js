'use strict';
/* global __dirname */
const electron          = require('electron');
const app               = electron.app;
const format            = require('stringformat');
const BrowserWindow     = electron.BrowserWindow;
const viewsFolder       = format('file://{0}/', __dirname);
var mainWindow          = null;

app.on('window-all-closed', () => {
    if(!isMacOsX()) {
        app.quit();
    }
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    mainWindow.loadURL(format('{0}/index.html', viewsFolder));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

function isMacOsX() {
    return process.platform === 'darwin';
}
