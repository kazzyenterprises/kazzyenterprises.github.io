// shared\components\global-status\global-erroor-status.component.js

import StatusBase from './global-status-base.js';

class ErrorStatusService extends StatusBase {
    constructor() {
        super();
        this.type = 'error';
        this.iconContent = '❌';
        this.duration = 5000; // 5 seconds
    }

    /**
     * Public API: Shows an error message.
     * @param {string} message - The message text.
     */
    show(message) {
        this._show(this.type, message, this.iconContent, this.duration);
    }
}

export const ErrorStatus = new ErrorStatusService();
