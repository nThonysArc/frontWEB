import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app.config.server'; // <--- CORREGIDO: Se quitó '/app/'

const bootstrap = () => bootstrapApplication(App, config);

export default bootstrap;