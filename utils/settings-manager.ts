// Settings Manager Module - TypeScript
// Handles settings persistence and management

interface SpeechSettings {
	rate: number;
	pitch: number;
	volume: number;
	voice: SpeechSynthesisVoice | null;
}

interface StorableSettings {
	rate: number;
	pitch: number;
	volume: number;
	voiceName: string | null;
}

interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

class SettingsManager {
	private defaultSettings: SpeechSettings = {
		rate: 0.9,
		pitch: 1.0,
		volume: 1.0,
		voice: null
	};
	
	private settings: SpeechSettings;
	private readonly storageKey: string = 'smart-reader-settings';

	constructor() {
		this.settings = { ...this.defaultSettings };
	}

	// Initialize settings manager
	public init(): void {
		this.loadSettings();
	}

	// Load settings from storage
	private loadSettings(): void {
		try {
			const stored: string | null = localStorage.getItem(this.storageKey);
			if (stored) {
				const parsedSettings: Partial<StorableSettings> = JSON.parse(stored);
				
				// Validate and apply settings with defaults
				this.settings = {
					rate: this.validateRate(parsedSettings.rate) || this.defaultSettings.rate,
					pitch: this.validatePitch(parsedSettings.pitch) || this.defaultSettings.pitch,
					volume: this.validateVolume(parsedSettings.volume) || this.defaultSettings.volume,
					voice: null // Will be set below
				};
				
				// Handle voice setting separately since it's an object
				if (parsedSettings.voiceName) {
					this.loadVoiceByName(parsedSettings.voiceName);
				}
			}
		} catch (error) {
			console.error('Error loading settings:', error);
			this.settings = { ...this.defaultSettings };
		}
	}

	// Load voice by name
	private loadVoiceByName(voiceName: string): void {
		try {
			const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices();
			this.settings.voice = voices.find((voice: SpeechSynthesisVoice) => voice.name === voiceName) || null;
		} catch (error) {
			console.error('Error loading voice by name:', error);
			this.settings.voice = null;
		}
	}

	// Save settings to storage
	private saveSettings(): void {
		try {
			const settingsToStore: StorableSettings = {
				rate: this.settings.rate,
				pitch: this.settings.pitch,
				volume: this.settings.volume,
				voiceName: this.settings.voice?.name || null
			};
			
			localStorage.setItem(this.storageKey, JSON.stringify(settingsToStore));
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	}

	// Validation methods
	private validateRate(rate: unknown): number | null {
		if (typeof rate === 'number' && rate >= 0.1 && rate <= 10) {
			return rate;
		}
		return null;
	}

	private validatePitch(pitch: unknown): number | null {
		if (typeof pitch === 'number' && pitch >= 0 && pitch <= 2) {
			return pitch;
		}
		return null;
	}

	private validateVolume(volume: unknown): number | null {
		if (typeof volume === 'number' && volume >= 0 && volume <= 1) {
			return volume;
		}
		return null;
	}

	// Update settings
	public updateSettings(newSettings: Partial<SpeechSettings>): void {
		let hasChanges = false;

		if (newSettings.rate !== undefined) {
			const validRate = this.validateRate(newSettings.rate);
			if (validRate !== null) {
				this.settings.rate = validRate;
				hasChanges = true;
			}
		}

		if (newSettings.pitch !== undefined) {
			const validPitch = this.validatePitch(newSettings.pitch);
			if (validPitch !== null) {
				this.settings.pitch = validPitch;
				hasChanges = true;
			}
		}

		if (newSettings.volume !== undefined) {
			const validVolume = this.validateVolume(newSettings.volume);
			if (validVolume !== null) {
				this.settings.volume = validVolume;
				hasChanges = true;
			}
		}

		if (newSettings.voice !== undefined) {
			this.settings.voice = newSettings.voice;
			hasChanges = true;
		}

		if (hasChanges) {
			this.saveSettings();
		}
	}

	// Get current settings (deep copy)
	public getSettings(): SpeechSettings {
		return {
			rate: this.settings.rate,
			pitch: this.settings.pitch,
			volume: this.settings.volume,
			voice: this.settings.voice
		};
	}

	// Reset to default settings
	public resetSettings(): SpeechSettings {
		this.settings = { ...this.defaultSettings };
		this.saveSettings();
		return this.getSettings();
	}

	// Get specific setting
	public getSetting<K extends keyof SpeechSettings>(key: K): SpeechSettings[K] {
		return this.settings[key];
	}

	// Set specific setting
	public setSetting<K extends keyof SpeechSettings>(key: K, value: SpeechSettings[K]): void {
		if (key === 'rate' && typeof value === 'number') {
			const validRate = this.validateRate(value);
			if (validRate !== null) {
				this.settings[key] = validRate as SpeechSettings[K];
			}
		} else if (key === 'pitch' && typeof value === 'number') {
			const validPitch = this.validatePitch(value);
			if (validPitch !== null) {
				this.settings[key] = validPitch as SpeechSettings[K];
			}
		} else if (key === 'volume' && typeof value === 'number') {
			const validVolume = this.validateVolume(value);
			if (validVolume !== null) {
				this.settings[key] = validVolume as SpeechSettings[K];
			}
		} else if (key === 'voice') {
			this.settings[key] = value;
		}
		
		this.saveSettings();
	}

	// Export settings as JSON
	public exportSettings(): string {
		try {
			const exportSettings: StorableSettings = {
				rate: this.settings.rate,
				pitch: this.settings.pitch,
				volume: this.settings.volume,
				voiceName: this.settings.voice?.name || null
			};
			return JSON.stringify(exportSettings, null, 2);
		} catch (error) {
			console.error('Error exporting settings:', error);
			return '{}';
		}
	}

	// Import settings from JSON
	public importSettings(jsonString: string): boolean {
		try {
			const importedSettings: Partial<StorableSettings> = JSON.parse(jsonString);
			
			// Create a new settings object with validated values
			const newSettings: Partial<SpeechSettings> = {};
			
			if (importedSettings.rate !== undefined) {
				const validRate = this.validateRate(importedSettings.rate);
				if (validRate !== null) {
					newSettings.rate = validRate;
				}
			}
			
			if (importedSettings.pitch !== undefined) {
				const validPitch = this.validatePitch(importedSettings.pitch);
				if (validPitch !== null) {
					newSettings.pitch = validPitch;
				}
			}
			
			if (importedSettings.volume !== undefined) {
				const validVolume = this.validateVolume(importedSettings.volume);
				if (validVolume !== null) {
					newSettings.volume = validVolume;
				}
			}
			
			if (importedSettings.voiceName) {
				const voices = speechSynthesis.getVoices();
				const voice = voices.find((v: SpeechSynthesisVoice) => v.name === importedSettings.voiceName);
				if (voice) {
					newSettings.voice = voice;
				}
			}
			
			this.updateSettings(newSettings);
			return true;
		} catch (error) {
			console.error('Error importing settings:', error);
			return false;
		}
	}

	// Check if settings are at default values
	public isDefault(): boolean {
		return (
			this.settings.rate === this.defaultSettings.rate &&
			this.settings.pitch === this.defaultSettings.pitch &&
			this.settings.volume === this.defaultSettings.volume &&
			this.settings.voice === this.defaultSettings.voice
		);
	}

	// Get settings validation status
	public validateSettings(): ValidationResult {
		const errors: string[] = [];
		
		if (this.settings.rate < 0.1 || this.settings.rate > 10) {
			errors.push('Rate must be between 0.1 and 10');
		}
		
		if (this.settings.pitch < 0 || this.settings.pitch > 2) {
			errors.push('Pitch must be between 0 and 2');
		}
		
		if (this.settings.volume < 0 || this.settings.volume > 1) {
			errors.push('Volume must be between 0 and 1');
		}
		
		return {
			isValid: errors.length === 0,
			errors: errors
		};
	}

	// Get default settings
	public getDefaultSettings(): SpeechSettings {
		return { ...this.defaultSettings };
	}

	// Clear all stored settings
	public clearStoredSettings(): void {
		try {
			localStorage.removeItem(this.storageKey);
			this.settings = { ...this.defaultSettings };
		} catch (error) {
			console.error('Error clearing stored settings:', error);
		}
	}

	// Check if localStorage is available
	public isStorageAvailable(): boolean {
		try {
			const test = '__storage_test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch (error) {
			return false;
		}
	}
}

// Export for use in other modules
(window as any).SettingsManager = SettingsManager;