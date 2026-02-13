// Speech Engine Module - TypeScript
// Handles all text-to-speech functionality

interface SpeechSettings {
	rate: number;
	pitch: number;
	volume: number;
	voice: SpeechSynthesisVoice | null;
}

interface ProgressInfo {
	currentWord: number;
	totalWords: number;
	percentage: number;
}

type StateChangeCallback = (isReading: boolean) => void;
type ProgressUpdateCallback = (progress: ProgressInfo) => void;
type VoicesLoadedCallback = (voices: SpeechSynthesisVoice[]) => void;
type WordHighlightCallback = (wordIndex: number) => void;

class SpeechEngine {
	private currentUtterance: SpeechSynthesisUtterance | null = null;
	private isReading: boolean = false;
	private words: string[] = [];
	private currentWordIndex: number = 0;
	private wordTrackingInterval: number | null = null;
	private settings: SpeechSettings = {
		rate: 0.9,
		pitch: 1.0,
		volume: 1.0,
		voice: null
	};

	public onStateChange: StateChangeCallback | null = null;
	public onProgressUpdate: ProgressUpdateCallback | null = null;
	public onVoicesLoaded: VoicesLoadedCallback | null = null;
	public onWordHighlight: WordHighlightCallback | null = null;

	constructor() {}

	// Initialize speech engine
	public init(): void {
		this.loadAvailableVoices();
	}

	// Load available voices
	private loadAvailableVoices(): void {
		const updateVoices = (): void => {
			const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices();
			if (this.onVoicesLoaded) {
				this.onVoicesLoaded(voices);
			}
		};

		if (speechSynthesis.getVoices().length > 0) {
			updateVoices();
		} else {
			speechSynthesis.addEventListener('voiceschanged', updateVoices);
		}
	}

	// Start reading text
	public startReading(text: string): void {
		if (!text || text.trim().length === 0) {
			console.warn('Cannot start reading: text is empty');
			return;
		}

		// Stop any ongoing speech without triggering state change (we'll do that when we start)
		this.stopReadingInternal();

		// Initialize tracking
		this.words = text.split(/\s+/).filter(word => word.length > 0);
		this.currentWordIndex = 0;
		console.log(`Speech engine: Initialized ${this.words.length} words for tracking:`, this.words.slice(0, 5));

		// Create speech utterance
		this.currentUtterance = new SpeechSynthesisUtterance(text);
		this.applySpeechSettings(this.currentUtterance);

		// Handle speech events
		this.currentUtterance.onstart = (): void => {
			this.isReading = true;
			console.log('Speech engine: Speech started, onWordHighlight callback available:', typeof this.onWordHighlight);
			this.startWordTracking();
			this.onStateChange?.(true);
		};

		this.currentUtterance.onend = (): void => {
			this.isReading = false;
			this.stopWordTracking();
			this.currentUtterance = null;
			this.onStateChange?.(false);
		};

		this.currentUtterance.onerror = (event: SpeechSynthesisErrorEvent): void => {
			this.isReading = false;
			this.stopWordTracking();
			this.currentUtterance = null;
			console.error('Speech synthesis error:', event.error);
			this.onStateChange?.(false);
		};

		// Start speaking
		try {
			speechSynthesis.speak(this.currentUtterance);
		} catch (error) {
			console.error('Failed to start speech synthesis:', error);
			this.isReading = false;
			this.currentUtterance = null;
			this.onStateChange?.(false);
		}
	}

	// Stop reading
	public stopReading(): void {
		this.stopReadingInternal();
		this.onStateChange?.(false);
	}
	
	// Internal stop method that doesn't trigger state change
	private stopReadingInternal(): void {
		try {
			speechSynthesis.cancel();
		} catch (error) {
			console.error('Error stopping speech synthesis:', error);
		}
		
		this.isReading = false;
		this.stopWordTracking();
		this.currentUtterance = null;
	}

	// Apply speech settings to utterance
	private applySpeechSettings(utterance: SpeechSynthesisUtterance): void {
		utterance.rate = Math.max(0.1, Math.min(10, this.settings.rate));
		utterance.pitch = Math.max(0, Math.min(2, this.settings.pitch));
		utterance.volume = Math.max(0, Math.min(1, this.settings.volume));
		
		if (this.settings.voice) {
			utterance.voice = this.settings.voice;
		}
	}

	// Update settings and restart if reading
	public updateSettings(newSettings: Partial<SpeechSettings>): void {
		// Validate and update settings
		if (newSettings.rate !== undefined) {
			this.settings.rate = Math.max(0.1, Math.min(10, newSettings.rate));
		}
		if (newSettings.pitch !== undefined) {
			this.settings.pitch = Math.max(0, Math.min(2, newSettings.pitch));
		}
		if (newSettings.volume !== undefined) {
			this.settings.volume = Math.max(0, Math.min(1, newSettings.volume));
		}
		if (newSettings.voice !== undefined) {
			this.settings.voice = newSettings.voice;
		}

		if (this.isReading) {
			this.restartFromCurrentPosition();
		}
	}

	// Restart speech from current position with new settings
	private restartFromCurrentPosition(): void {
		if (!this.isReading || !this.currentUtterance || !this.words.length) {
			return;
		}

		// Cancel current speech
		try {
			speechSynthesis.cancel();
		} catch (error) {
			console.error('Error canceling speech during restart:', error);
		}

		// Get remaining text from current word position
		const remainingWords: string[] = this.words.slice(this.currentWordIndex);
		const remainingText: string = remainingWords.join(' ');

		if (remainingText.trim()) {
			// Create new utterance with remaining text
			this.currentUtterance = new SpeechSynthesisUtterance(remainingText);
			this.applySpeechSettings(this.currentUtterance);

			// Handle speech events
			this.currentUtterance.onstart = (): void => {
				// Restart word tracking with updated speed
				this.stopWordTracking();
				this.startWordTracking();
			};

			this.currentUtterance.onend = (): void => {
				this.isReading = false;
				this.stopWordTracking();
				this.currentUtterance = null;
				this.onStateChange?.(false);
			};

			this.currentUtterance.onerror = (event: SpeechSynthesisErrorEvent): void => {
				this.isReading = false;
				this.stopWordTracking();
				this.currentUtterance = null;
				console.error('Speech synthesis error during restart:', event.error);
				this.onStateChange?.(false);
			};

			// Start speaking from current position
			try {
				speechSynthesis.speak(this.currentUtterance);
			} catch (error) {
				console.error('Failed to restart speech synthesis:', error);
				this.isReading = false;
				this.currentUtterance = null;
				this.onStateChange?.(false);
			}
		}
	}

	// Start word tracking
	private startWordTracking(): void {
		if (!this.words.length) return;

		// Stop any existing tracking
		this.stopWordTracking();

		// Estimate reading speed based on current rate setting
		const baseWordsPerSecond: number = 2.5;
		const wordsPerSecond: number = baseWordsPerSecond * this.settings.rate;
		const intervalMs: number = 1000 / wordsPerSecond;
		console.log(`Speech engine: Word tracking interval: ${intervalMs}ms (${wordsPerSecond} words/sec, rate: ${this.settings.rate})`);

		// Highlight first word immediately
		console.log('Speech engine: Starting word tracking, highlighting first word (index 0)');
		this.onWordHighlight?.(0);

		this.wordTrackingInterval = window.setInterval((): void => {
			this.currentWordIndex++;
			if (this.currentWordIndex >= this.words.length) {
				this.stopWordTracking();
				return;
			}
			
			// Highlight current word
			console.log(`Speech engine: Highlighting word ${this.currentWordIndex} of ${this.words.length}`);
			this.onWordHighlight?.(this.currentWordIndex);
			this.updateProgress();
		}, intervalMs);
	}

	// Stop word tracking
	private stopWordTracking(): void {
		if (this.wordTrackingInterval !== null) {
			clearInterval(this.wordTrackingInterval);
			this.wordTrackingInterval = null;
		}
	}

	// Update progress
	private updateProgress(): void {
		if (this.onProgressUpdate) {
			const progress: ProgressInfo = {
				currentWord: this.currentWordIndex,
				totalWords: this.words.length,
				percentage: this.words.length > 0 ? (this.currentWordIndex / this.words.length) * 100 : 0
			};
			this.onProgressUpdate(progress);
		}
	}

	// Test voice with current settings
	public testVoice(): void {
		const testText: string = "This is a test of the selected voice settings.";
		const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance(testText);
		this.applySpeechSettings(utterance);
		
		try {
			speechSynthesis.cancel();
			speechSynthesis.speak(utterance);
		} catch (error) {
			console.error('Failed to test voice:', error);
		}
	}

	// Reset settings to default
	public resetSettings(): SpeechSettings {
		this.settings = {
			rate: 0.9,
			pitch: 1.0,
			volume: 1.0,
			voice: null
		};
		return { ...this.settings };
	}

	// Get current progress
	public getProgress(): ProgressInfo {
		return {
			currentWord: this.currentWordIndex,
			totalWords: this.words.length,
			percentage: this.words.length > 0 ? (this.currentWordIndex / this.words.length) * 100 : 0
		};
	}

	// Get current settings
	public getSettings(): SpeechSettings {
		return { ...this.settings };
	}

	// Check if currently reading
	public get IsReading(): boolean {
		return this.isReading;
	}
}

// Export for use in other modules
window.SpeechEngine = SpeechEngine;