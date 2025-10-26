// shared\components\global-status\global-success-status.component.js

// Import the base class (assuming your file is named global-status.base.js)
import StatusBase from './global-status.base.js';

class SuccessStatusService extends StatusBase {
    constructor() {
        super();
        this.type = 'success';
        this.iconContent = '✔';
        this.duration = 3000; // 3 seconds
        // NOTE: The done button handler is inherited and automatically attached/cleared by StatusBase.
    }

    /**
     * Public API: Shows a success message.
     * @param {string} message - The message text.
     */
    show(message) {
        this._show(this.type, message, this.iconContent, this.duration);
    }
}

// Export the named constant 'SuccessStatus'
export const SuccessStatus = new SuccessStatusService();
