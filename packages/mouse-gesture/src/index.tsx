import { render } from 'solid-js/web';
import App from './App';
const appContainer = document.createElement('div');
appContainer.id = 'rock-scroll-app';
document.body.appendChild(appContainer);
render(() => <App />, appContainer);