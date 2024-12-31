/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'ipc-example'
  | 'gcode:load'
  | 'ipc-prova'
  | 'arduino-serial-data'
  | 'send-serial-command'
  | 'prepareGcode'
  | 'initBuffer-start'
  | 'initBuffer-end'
  | 'initBuffer-stop'
  | 'serialData';

const electronHandler = {
  ipcRenderer: {
    // Funzione per inviare un messaggio su un canale specificato
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },

    // Funzione per ascoltare eventi su un canale
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      // Restituisce una funzione per rimuovere l'ascoltatore
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },

    // Funzione per ascoltare un evento una sola volta su un canale
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },

    // Aggiungi la funzione off per rimuovere gli ascoltatori
    off(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.removeListener(channel, func);
    },
  },
};

// Espone l'oggetto `electronHandler` al contesto globale
contextBridge.exposeInMainWorld('electron', electronHandler);

// Definisce il tipo per il nostro handler
export type ElectronHandler = typeof electronHandler;
