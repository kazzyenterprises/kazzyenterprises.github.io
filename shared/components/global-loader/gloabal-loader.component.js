// shared/components/global-loader/global-loader.service.js

class LoaderService {
    constructor() {
        this.overlay = null;
        this.textElement = null;
        this.isInitialized = false;
        
        // 1. Store the promise from _init() so other code can wait for it.
        this.initPromise = this._init();
    }
    
    /**
     * Public method to await the component's setup.
     */
    async waitInit() {
        return this.initPromise;
    }

    // 1. Internal initialization function to load the HTML fragment
    async _init() {
        if (this.isInitialized) return;
        
        try {
            // NOTE: Adjusted path to standard naming convention (assuming .html extension)
            const response = await fetch('shared/components/global-loader/gloabal-loader.component.html'); 
            const html = await response.text();
            
            // Create a temporary container to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Append the component to the body once
            // Ensure we append the actual overlay element, not the temporary div
            this.overlay = tempDiv.firstElementChild;
            if (this.overlay) {
                document.body.appendChild(this.overlay);
                this.textElement = this.overlay.querySelector('#loader-text');
                this.isInitialized = true;
            } else {
                console.error("Loader HTML fragment was empty or invalid.");
            }
            
        } catch (error) {
            console.error("Failed to initialize Global Loader Component:", error);
        }
    }

    /**
     * Shows the loader overlay.
     * @param {string} [text='Loading...'] - The message to display.
     */
    show(text = 'Loading...') {
        if (!this.overlay || !this.isInitialized) {
            // Fallback: If not initialized, queue the call until it is ready.
            this.initPromise.then(() => this.show(text));
            return;
        }

        this.setText(text);
        this.overlay.classList.remove('loader-hidden');
        this.overlay.style.display = 'flex'; 
    }

    /**
     * Hides the loader overlay.
     */
    hide() {
        if (this.overlay) {
            this.overlay.classList.add('loader-hidden');
            setTimeout(() => {
                if(this.overlay.classList.contains('loader-hidden')) {
                    this.overlay.style.display = 'none';
                }
            }, 300);
        }
    }

    /**
     * Sets the text displayed in the loader.
     * @param {string} text - The new message.
     */
    setText(text) {
        if (this.textElement) {
            this.textElement.textContent = text;
        }
    }
}

// Export a single, global instance (Singleton)
export const Loader = new LoaderService();