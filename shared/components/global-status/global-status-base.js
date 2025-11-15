// shared\components\global-status\global-status.base.js

class StatusBase {
    constructor() {
        this.container = null;
        this.messageElement = null;
        this.iconElement = null;
        this.dismissButton = null;
        this.timeoutId = null;
        this.isInitialized = false;
        
        this.initPromise = this._init(); 
        this._handleDismiss = this._handleDismiss.bind(this);
    }

    async _init() {
        if (this.isInitialized) return;
        
        try {
            // NOTE: The HTML file path is assumed correct: 'shared/components/global-status/global-status.component.html'
            const response = await fetch('shared/components/global-status/global-status-component.html'); 
            const html = await response.text();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            this.container = tempDiv.firstElementChild;

            if (!document.getElementById(this.container.id)) {
                document.body.appendChild(this.container);
            }
            
            this.messageElement = this.container.querySelector('#status-message');
            this.iconElement = this.container.querySelector('#status-icon');
            this.dismissButton = this.container.querySelector('#status-dismiss-btn');

            if (this.dismissButton) {
                 this.dismissButton.addEventListener('click', this._handleDismiss);
            }
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error("Failed to initialize Global Status Base Component:", error);
        }
    }
    
    _handleDismiss() {
        this.hide();
    }

    async waitInit() {
        return this.initPromise;
    }

    _show(type, message, iconContent, duration) {
        if (!this.container || !this.isInitialized) {
            this.initPromise.then(() => this._show(type, message, iconContent, duration));
            return;
        }

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.messageElement.textContent = message;
        this.iconElement.textContent = iconContent;
        
        this.container.className = '';
        this.container.classList.add(type, 'status-visible');
        
        this.timeoutId = setTimeout(() => this.hide(), duration);
    }

    hide() {
        if (this.container) {
            this.container.classList.remove('status-visible');
            this.container.classList.add('status-hidden');
            
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
        }
    }
}

// MANDATORY: Default export for the base class
export default StatusBase;
