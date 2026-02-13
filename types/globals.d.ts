// Global Type Definitions for Smart Reader Extension

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

interface ApplicationState {
	isReading: boolean;
	currentSelection: string;
	progress: ProgressInfo;
	settings: SpeechSettings;
}

// Module class declarations
declare class SpeechEngineClass {
	public onStateChange: ((isReading: boolean) => void) | null;
	public onProgressUpdate: ((progress: ProgressInfo) => void) | null;
	public onVoicesLoaded: ((voices: SpeechSynthesisVoice[]) => void) | null;
	public onWordHighlight: ((wordIndex: number) => void) | null;
	public IsReading: boolean;
	
	constructor();
	init(): void;
	startReading(text: string): void;
	stopReading(): void;
	updateSettings(settings: Partial<SpeechSettings>): void;
	testVoice(): void;
	resetSettings(): SpeechSettings;
	getProgress(): ProgressInfo;
	getSettings(): SpeechSettings;
}

declare class UIComponentsClass {
	public onIconClick: (() => void) | null;
	public onSettingsChange: ((settings: Partial<SpeechSettings>) => void) | null;
	public onToggleSettings: (() => void) | null;
	public onTestVoice: (() => void) | null;
	public onResetSettings: (() => void) | null;
	
	constructor();
	init(): void;
	showReadingIcon(range: Range): void;
	hideReadingIcon(): void;
	showProgressBar(range: Range): void;
	hideProgressBar(): void;
	updateProgress(progress: ProgressInfo): void;
	updateIconState(isReading: boolean): void;
	showSettingsPopup(): void;
	hideSettingsPopup(): void;
	toggleSettingsPopup(): void;
	loadVoices(voices: SpeechSynthesisVoice[]): void;
	updateSettingsUI(settings: SpeechSettings): void;
	getSettingsPopup(): HTMLDivElement | null;
	highlightSelectedText(range: Range): HTMLElement[];
	highlightCurrentWord(wordIndex: number): void;
	clearHighlighting(): void;
	getHighlightedWordCount(): number;
	getHighlightedText(): string;
	debugHighlighting(): void;
	testWordHighlighting(): void;
	destroy(): void;
}

declare class SettingsManagerClass {
	constructor();
	init(): void;
	updateSettings(settings: Partial<SpeechSettings>): void;
	getSettings(): SpeechSettings;
	resetSettings(): SpeechSettings;
	getSetting<K extends keyof SpeechSettings>(key: K): SpeechSettings[K];
	setSetting<K extends keyof SpeechSettings>(key: K, value: SpeechSettings[K]): void;
	exportSettings(): string;
	importSettings(jsonString: string): boolean;
	isDefault(): boolean;
	validateSettings(): { isValid: boolean; errors: string[] };
	getDefaultSettings(): SpeechSettings;
	clearStoredSettings(): void;
	isStorageAvailable(): boolean;
}

declare class DragHandlerClass {
	public IsDragging: boolean;
	public CurrentDragElement: HTMLElement | null;
	
	constructor();
	initDrag(element: HTMLElement, dragHandle?: HTMLElement | null): void;
	forceStopDrag(): void;
	destroy(): void;
	setBoundaries(minX: number, minY: number, maxX: number, maxY: number): void;
	setEnabled(enabled: boolean): void;
}

declare class SmartReaderClass {
	public IsInitialized: boolean;
	public CurrentSelection: string;
	
	constructor();
	init(): void;
	getState(): ApplicationState | null;
	destroy(): void;
	forceStop(): void;
	exportSettings(): string | null;
	importSettings(jsonString: string): boolean;
}

// Global window interface extensions
declare global {
	interface Window {
		SpeechEngine: typeof SpeechEngineClass;
		UIComponents: typeof UIComponentsClass;
		SettingsManager: typeof SettingsManagerClass;
		DragHandler: typeof DragHandlerClass;
		SmartReader: typeof SmartReaderClass;
		smartReader?: SmartReaderClass;
	}
}