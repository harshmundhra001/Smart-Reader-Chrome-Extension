// Smart Reader Main Module - TypeScript
// Coordinates all components and handles main application logic

export {};

declare global {
	interface Window {
		DragHandler: typeof DragHandlerClass;
		SettingsManager: typeof SettingsManagerClass;
		SmartReader: typeof SmartReader;
		SpeechEngine: typeof SpeechEngineClass;
		UIComponents: typeof UIComponentsClass;
	}
}

class SmartReader {
	private speechEngine: SpeechEngineClass | null = null;
	private uiComponents: UIComponentsClass | null = null;
	private settingsManager: SettingsManagerClass | null = null;
	private dragHandler: DragHandlerClass | null = null;
	
	private currentSelection: string = '';
	private originalRange: Range | null = null;
	private isInitialized: boolean = false;

	constructor() {}

	// Initialize the Smart Reader extension
	public init(): void {
		if (this.isInitialized) {
			console.warn('SmartReader already initialized');
			return;
		}

		try {
			// Check if classes are available
			if (!window.SpeechEngine || !window.UIComponents || !window.SettingsManager || !window.DragHandler) {
				throw new Error('Required classes not available on window object');
			}

			// Initialize all modules
			this.speechEngine = new window.SpeechEngine();
			this.uiComponents = new window.UIComponents();
			this.settingsManager = new window.SettingsManager();
			this.dragHandler = new window.DragHandler();

			// Initialize components
			this.speechEngine.init();
			this.uiComponents.init();
			this.settingsManager.init();

			// Setup event handlers
			this.setupEventHandlers();
			this.setupSelectionListeners();

			// Initialize drag functionality for settings popup
			const settingsPopup = this.uiComponents!.getSettingsPopup();
			if (settingsPopup) {
				const header = document.getElementById('settings-header');
				this.dragHandler!.initDrag(settingsPopup, header);
			}

			// Load saved settings
			this.loadSettings();

			this.isInitialized = true;
			console.log('SmartReader initialized successfully');
		} catch (error) {
			console.error('Error initializing SmartReader:', error);
			this.isInitialized = false;
		}
	}

	// Setup event handlers between modules
	private setupEventHandlers(): void {
		if (!this.speechEngine || !this.uiComponents || !this.settingsManager) {
			throw new Error('Components not initialized');
		}

		// Speech engine callbacks
		this.speechEngine!.onStateChange = (isReading: boolean): void => {
			this.uiComponents?.updateIconState(isReading);
			if (!isReading) {
				this.uiComponents?.hideProgressBar();
				// Only clear highlighting if we're not in the middle of starting a new reading session
				// We'll clear it manually in stopReading() method when truly stopping
			}
		};

		this.speechEngine!.onProgressUpdate = (progress: ProgressInfo): void => {
			this.uiComponents?.updateProgress(progress);
		};

		this.speechEngine!.onVoicesLoaded = (voices: SpeechSynthesisVoice[]): void => {
			this.uiComponents?.loadVoices(voices);
		};

		this.speechEngine!.onWordHighlight = (wordIndex: number): void => {
			console.log(`Smart Reader: Received word highlight callback for word ${wordIndex}`);
			if (this.uiComponents) {
				this.uiComponents.highlightCurrentWord(wordIndex);
			} else {
				console.error('Smart Reader: UI Components not available for word highlighting!');
			}
		};
		
		// Verify callback is connected
		console.log('Smart Reader: onWordHighlight callback connected:', typeof this.speechEngine!.onWordHighlight);

		// UI component callbacks
		this.uiComponents!.onIconClick = (): void => {
			this.handleIconClick();
		};

		this.uiComponents!.onToggleSettings = (): void => {
			this.uiComponents?.toggleSettingsPopup();
		};

		this.uiComponents!.onSettingsChange = (newSettings: Partial<SpeechSettings>): void => {
			this.updateSettings(newSettings);
		};

		this.uiComponents!.onTestVoice = (): void => {
			this.speechEngine?.testVoice();
		};

		this.uiComponents!.onResetSettings = (): void => {
			this.resetSettings();
		};
	}

	// Setup text selection listeners
	private setupSelectionListeners(): void {
		const handleSelection = (): void => this.handleSelection();
		
		document.addEventListener('mouseup', handleSelection);
		document.addEventListener('keyup', handleSelection);
		document.addEventListener('selectionchange', handleSelection);
	}

	// Handle text selection
	private handleSelection(): void {
		try {
			const selection: Selection | null = window.getSelection();
			if (!selection) return;

			const selectedText: string = selection.toString().trim();

			// Skip if selection hasn't changed
			if (selectedText === this.currentSelection) return;

			this.currentSelection = selectedText;
			const wordCount: number = selectedText ? selectedText.split(/\s+/).filter(word => word.length > 0).length : 0;

			if (wordCount > 15) {
				this.showReadingInterface();
				// Store original range for tracking
				if (selection.rangeCount > 0) {
					this.originalRange = selection.getRangeAt(0).cloneRange();
				}
			} else {
				this.hideReadingInterface();
			}
		} catch (error) {
			console.error('Error handling selection:', error);
		}
	}

	// Show reading interface elements
	private showReadingInterface(): void {
		if (this.originalRange && this.uiComponents) {
			this.uiComponents.showReadingIcon(this.originalRange);
		}
	}

	// Hide reading interface elements
	private hideReadingInterface(): void {
		if (!this.speechEngine?.IsReading && this.uiComponents) {
			this.uiComponents.hideReadingIcon();
		}
		this.uiComponents?.hideProgressBar();
	}

	// Handle reading icon click
	private handleIconClick(): void {
		if (!this.speechEngine) return;

		if (this.speechEngine.IsReading) {
			this.stopReading();
		} else {
			this.startReading();
		}
	}

	// Start reading selected text
	private startReading(): void {
		if (!this.currentSelection || !this.speechEngine || !this.uiComponents) {
			console.warn('Cannot start reading: missing requirements');
			return;
		}

		try {
			// Highlight the selected text with blue background
			if (this.originalRange) {
				this.uiComponents.highlightSelectedText(this.originalRange);
				
				// Show progress bar
				this.uiComponents.showProgressBar(this.originalRange);
				
				// Get the highlighted text to ensure we're reading what's actually highlighted
				const highlightedText = this.uiComponents.getHighlightedText();
				const highlightedCount = this.uiComponents.getHighlightedWordCount();
				console.log(`Smart Reader: Highlighted ${highlightedCount} words, text: "${highlightedText.substring(0, 100)}..."`);  
				if (highlightedText.trim()) {
					this.speechEngine.startReading(highlightedText);
				} else {
					// Fallback to original selection
					console.log('Smart Reader: No highlighted text, using original selection');
					this.speechEngine.startReading(this.currentSelection);
				}
			} else {
				// No range available, use original selection
				this.speechEngine.startReading(this.currentSelection);
			}
		} catch (error) {
			console.error('Error starting reading:', error);
		}
	}

	// Stop reading
	private stopReading(): void {
		try {
			this.speechEngine?.stopReading();
			// Clear highlighting when truly stopping (not when restarting)
			this.uiComponents?.clearHighlighting();
		} catch (error) {
			console.error('Error stopping reading:', error);
		}
	}

	// Update settings
	private updateSettings(newSettings: Partial<SpeechSettings>): void {
		if (!this.settingsManager || !this.speechEngine || !this.uiComponents) return;

		try {
			// Update settings manager
			this.settingsManager.updateSettings(newSettings);
			
			// Update speech engine
			this.speechEngine.updateSettings(newSettings);
			
			// Update UI
			this.uiComponents.updateSettingsUI(this.settingsManager.getSettings());
		} catch (error) {
			console.error('Error updating settings:', error);
		}
	}

	// Reset settings to defaults
	private resetSettings(): void {
		if (!this.settingsManager || !this.speechEngine || !this.uiComponents) return;

		try {
			const defaultSettings = this.settingsManager.resetSettings();
			this.speechEngine.updateSettings(defaultSettings);
			this.uiComponents.updateSettingsUI(defaultSettings);
		} catch (error) {
			console.error('Error resetting settings:', error);
		}
	}

	// Load saved settings
	private loadSettings(): void {
		if (!this.settingsManager || !this.speechEngine || !this.uiComponents) return;

		try {
			const settings = this.settingsManager.getSettings();
			this.speechEngine.updateSettings(settings);
			this.uiComponents.updateSettingsUI(settings);
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	}

	// Get current state
	public getState(): ApplicationState | null {
		if (!this.speechEngine || !this.settingsManager) {
			return null;
		}

		try {
			return {
				isReading: this.speechEngine.IsReading,
				currentSelection: this.currentSelection,
				progress: this.speechEngine.getProgress(),
				settings: this.settingsManager.getSettings()
			};
		} catch (error) {
			console.error('Error getting state:', error);
			return null;
		}
	}

	// Check if initialized
	public get IsInitialized(): boolean {
		return this.isInitialized;
	}

	// Get current selection
	public get CurrentSelection(): string {
		return this.currentSelection;
	}

	// Cleanup method
	public destroy(): void {
		try {
			if (this.speechEngine) {
				this.speechEngine.stopReading();
			}
			
			// Remove UI elements
			this.uiComponents?.destroy();

			// Clean up drag handler
			this.dragHandler?.destroy();

			// Clear references
			this.speechEngine = null;
			this.uiComponents = null;
			this.settingsManager = null;
			this.dragHandler = null;
			this.originalRange = null;

			this.isInitialized = false;
			console.log('SmartReader destroyed');
		} catch (error) {
			console.error('Error destroying SmartReader:', error);
		}
	}

	// Force stop all activities
	public forceStop(): void {
		try {
			this.speechEngine?.stopReading();
			this.uiComponents?.hideReadingIcon();
			this.uiComponents?.hideProgressBar();
			this.uiComponents?.hideSettingsPopup();
			this.dragHandler?.forceStopDrag();
		} catch (error) {
			console.error('Error force stopping SmartReader:', error);
		}
	}

	// Export settings
	public exportSettings(): string | null {
		try {
			return this.settingsManager?.exportSettings() || null;
		} catch (error) {
			console.error('Error exporting settings:', error);
			return null;
		}
	}

	// Import settings
	public importSettings(jsonString: string): boolean {
		try {
			return this.settingsManager?.importSettings(jsonString) || false;
		} catch (error) {
			console.error('Error importing settings:', error);
			return false;
		}
	}

	// Debug highlighting (for testing)
	public debugHighlighting(): void {
		this.uiComponents?.debugHighlighting();
	}
	
	// Test word highlighting (for testing)
	public testWordHighlighting(): void {
		this.uiComponents?.testWordHighlighting();
	}
}

// Initialize Smart Reader when DOM is ready
function initSmartReader(): void {
	try {
		const smartReader = new SmartReader();
		smartReader.init();
		
		// Make it globally accessible for debugging
		(window as any).smartReader = smartReader;
		
		console.log('Smart Reader extension loaded');
	} catch (error) {
		console.error('Failed to initialize Smart Reader:', error);
	}
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initSmartReader);
} else {
	initSmartReader();
}

// Export for potential external use
window.SmartReader = SmartReader;