// UI Components Module - TypeScript
// Handles all user interface elements

interface ProgressInfo {
	currentWord: number;
	totalWords: number;
	percentage: number;
}

interface SpeechSettings {
	rate: number;
	pitch: number;
	volume: number;
	voice: SpeechSynthesisVoice | null;
}

type IconClickCallback = () => void;
type SettingsChangeCallback = (settings: Partial<SpeechSettings>) => void;
type ToggleSettingsCallback = () => void;
type TestVoiceCallback = () => void;
type ResetSettingsCallback = () => void;

class UIComponents {
	private readingIcon: HTMLImageElement | null = null;
	private progressBar: HTMLDivElement | null = null;
	private settingsPopup: HTMLDivElement | null = null;
	private highlightedElements: HTMLElement[] = [];

	public onIconClick: IconClickCallback | null = null;
	public onSettingsChange: SettingsChangeCallback | null = null;
	public onToggleSettings: ToggleSettingsCallback | null = null;
	public onTestVoice: TestVoiceCallback | null = null;
	public onResetSettings: ResetSettingsCallback | null = null;

	constructor() {}

	// Initialize all UI components
	public init(): void {
		this.createReadingIcon();
		this.createProgressBar();
		this.createSettingsPopup();
	}

	// Create floating reading icon
	private createReadingIcon(): void {
		this.readingIcon = document.createElement('img');
		this.readingIcon.id = 'smart-reader-icon';
		this.readingIcon.src = chrome.runtime.getURL('icon.png');
		this.readingIcon.style.cssText = `
			position: fixed;
			z-index: 10000;
			width: 40px;
			height: 40px;
			cursor: pointer;
			display: none;
			box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			transition: all 0.3s ease;
			user-select: none;
			pointer-events: auto;
			border-radius: 50%;
		`;

		// Add hover effects
		this.readingIcon.addEventListener('mouseenter', (): void => {
			if (this.readingIcon) {
				this.readingIcon.style.transform = 'scale(1.1)';
				this.readingIcon.style.opacity = '0.8';
			}
		});

		this.readingIcon.addEventListener('mouseleave', (): void => {
			if (this.readingIcon) {
				this.readingIcon.style.transform = 'scale(1)';
				this.readingIcon.style.opacity = '1';
			}
		});

		// Add click handler
		this.readingIcon.addEventListener('click', (): void => {
			this.onIconClick?.();
		});

		// Add right-click handler for settings
		this.readingIcon.addEventListener('contextmenu', (e: MouseEvent): void => {
			e.preventDefault();
			this.onToggleSettings?.();
		});

		document.body.appendChild(this.readingIcon);
	}

	// Create progress bar
	private createProgressBar(): void {
		this.progressBar = document.createElement('div');
		this.progressBar.id = 'smart-reader-progress';
		this.progressBar.style.cssText = `
			position: fixed;
			z-index: 10001;
			background: rgba(66, 133, 244, 0.2);
			border: 2px solid #4285f4;
			border-radius: 10px;
			padding: 8px;
			display: none;
			min-width: 200px;
			box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			backdrop-filter: blur(10px);
			font-family: Arial, sans-serif;
			font-size: 12px;
			color: #333;
		`;

		this.progressBar.innerHTML = `
			<div style="margin-bottom: 5px; font-weight: bold;">Reading Progress</div>
			<div style="background: #f0f0f0; border-radius: 5px; height: 6px; margin-bottom: 5px;">
				<div id="progress-fill" style="background: #4285f4; height: 100%; border-radius: 5px; width: 0%; transition: width 0.3s ease;"></div>
			</div>
			<div id="progress-text">0 / 0 words</div>
		`;

		document.body.appendChild(this.progressBar);
	}

	// Create settings popup
	private createSettingsPopup(): void {
		this.settingsPopup = document.createElement('div');
		this.settingsPopup.id = 'smart-reader-settings';
		this.settingsPopup.style.cssText = `
			position: fixed;
			z-index: 10002;
			background: rgba(255, 255, 255, 0.95);
			border: 2px solid #4285f4;
			border-radius: 12px;
			padding: 20px;
			display: none;
			min-width: 280px;
			box-shadow: 0 8px 32px rgba(0,0,0,0.2);
			backdrop-filter: blur(10px);
			font-family: Arial, sans-serif;
			font-size: 14px;
			color: #333;
			cursor: move;
			user-select: none;
		`;

		this.settingsPopup.innerHTML = `
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; cursor: move;" id="settings-header">
				<h3 style="margin: 0; color: #4285f4; font-size: 16px;">Speech Settings</h3>
				<button id="close-settings" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999; padding: 0; width: 24px; height: 24px;">×</button>
			</div>

			<div style="margin-bottom: 15px;">
				<label style="display: block; margin-bottom: 5px; font-weight: bold;">Speed:</label>
				<input type="range" id="speed-slider" min="0.5" max="2.0" step="0.1" value="0.9" style="width: 100%; margin-bottom: 5px;">
				<span id="speed-value" style="font-size: 12px; color: #666;">0.9x</span>
			</div>

			<div style="margin-bottom: 15px;">
				<label style="display: block; margin-bottom: 5px; font-weight: bold;">Pitch:</label>
				<input type="range" id="pitch-slider" min="0.5" max="2.0" step="0.1" value="1.0" style="width: 100%; margin-bottom: 5px;">
				<span id="pitch-value" style="font-size: 12px; color: #666;">1.0x</span>
			</div>

			<div style="margin-bottom: 15px;">
				<label style="display: block; margin-bottom: 5px; font-weight: bold;">Volume:</label>
				<input type="range" id="volume-slider" min="0.1" max="1.0" step="0.1" value="1.0" style="width: 100%; margin-bottom: 5px;">
				<span id="volume-value" style="font-size: 12px; color: #666;">100%</span>
			</div>

			<div style="margin-bottom: 15px;">
				<label style="display: block; margin-bottom: 5px; font-weight: bold;">Voice:</label>
				<select id="voice-select" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
					<option value="">Default</option>
				</select>
			</div>

			<div style="display: flex; gap: 10px;">
				<button id="test-voice" style="flex: 1; background: #4285f4; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Test Voice</button>
				<button id="reset-settings" style="flex: 1; background: #f44336; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Reset</button>
			</div>
		`;

		document.body.appendChild(this.settingsPopup);
		this.setupSettingsEventListeners();
	}

	// Setup settings event listeners
	private setupSettingsEventListeners(): void {
		// Close button
		const closeButton = document.getElementById('close-settings') as HTMLButtonElement;
		closeButton?.addEventListener('click', (): void => {
			this.hideSettingsPopup();
		});

		// Speed slider
		const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
		const speedValue = document.getElementById('speed-value') as HTMLSpanElement;
		speedSlider?.addEventListener('input', (e: Event): void => {
			const target = e.target as HTMLInputElement;
			const rate: number = parseFloat(target.value);
			if (speedValue) {
				speedValue.textContent = `${target.value}x`;
			}
			this.onSettingsChange?.({ rate });
		});

		// Pitch slider
		const pitchSlider = document.getElementById('pitch-slider') as HTMLInputElement;
		const pitchValue = document.getElementById('pitch-value') as HTMLSpanElement;
		pitchSlider?.addEventListener('input', (e: Event): void => {
			const target = e.target as HTMLInputElement;
			const pitch: number = parseFloat(target.value);
			if (pitchValue) {
				pitchValue.textContent = `${target.value}x`;
			}
			this.onSettingsChange?.({ pitch });
		});

		// Volume slider
		const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
		const volumeValue = document.getElementById('volume-value') as HTMLSpanElement;
		volumeSlider?.addEventListener('input', (e: Event): void => {
			const target = e.target as HTMLInputElement;
			const volume: number = parseFloat(target.value);
			if (volumeValue) {
				volumeValue.textContent = `${Math.round(parseFloat(target.value) * 100)}%`;
			}
			this.onSettingsChange?.({ volume });
		});

		// Voice select
		const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
		voiceSelect?.addEventListener('change', (e: Event): void => {
			const target = e.target as HTMLSelectElement;
			const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices();
			const voice: SpeechSynthesisVoice | null = voices.find((voice) => voice.name === target.value) || null;
			this.onSettingsChange?.({ voice });
		});

		// Test voice button
		const testButton = document.getElementById('test-voice') as HTMLButtonElement;
		testButton?.addEventListener('click', (): void => {
			this.onTestVoice?.();
		});

		// Reset settings button
		const resetButton = document.getElementById('reset-settings') as HTMLButtonElement;
		resetButton?.addEventListener('click', (): void => {
			this.onResetSettings?.();
		});
	}

	// Show reading icon near selection
	public showReadingIcon(range: Range): void {
		if (!range || !this.readingIcon) return;

		try {
			const rect: DOMRect = range.getBoundingClientRect();
			const iconX: number = Math.min(rect.right + 10, window.innerWidth - 60);
			const iconY: number = rect.top + window.scrollY - 10;

			this.readingIcon.style.left = `${iconX}px`;
			this.readingIcon.style.top = `${iconY}px`;
			this.readingIcon.style.display = 'flex';
		} catch (error) {
			console.error('Error showing reading icon:', error);
		}
	}

	// Hide reading icon
	public hideReadingIcon(): void {
		if (this.readingIcon) {
			this.readingIcon.style.display = 'none';
		}
	}

	// Show progress bar
	public showProgressBar(range: Range): void {
		if (!range || !this.progressBar) return;

		try {
			const rect: DOMRect = range.getBoundingClientRect();
			const progressX: number = rect.left + window.scrollX;
			const progressY: number = rect.bottom + window.scrollY + 10;

			this.progressBar.style.left = `${progressX}px`;
			this.progressBar.style.top = `${progressY}px`;
			this.progressBar.style.display = 'block';
		} catch (error) {
			console.error('Error showing progress bar:', error);
		}
	}

	// Hide progress bar
	public hideProgressBar(): void {
		if (this.progressBar) {
			this.progressBar.style.display = 'none';
		}
	}

	// Update progress display
	public updateProgress(progress: ProgressInfo): void {
		const progressFill = document.getElementById('progress-fill') as HTMLDivElement;
		const progressText = document.getElementById('progress-text') as HTMLDivElement;

		if (progressFill && progressText) {
			// Use highlighted elements count if available, otherwise use progress info
			const totalWords = this.highlightedElements.length > 0 ? this.highlightedElements.length : progress.totalWords;
			const currentWord = progress.currentWord;
			const percentage = totalWords > 0 ? (currentWord / totalWords) * 100 : 0;
			
			progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
			progressText.textContent = `${currentWord} / ${totalWords} words`;
		}
	}

	// Update icon state based on reading status
	public updateIconState(isReading: boolean): void {
		if (!this.readingIcon) return;

		if (isReading) {
			this.readingIcon.style.filter = 'hue-rotate(120deg)';
			this.readingIcon.style.backgroundColor = '#87CEEB'; // Light blue background
			this.readingIcon.style.borderRadius = '50%';
			this.readingIcon.style.padding = '4px';
			this.readingIcon.title = 'Stop reading';
		} else {
			this.readingIcon.style.filter = 'none';
			this.readingIcon.style.backgroundColor = 'transparent';
			this.readingIcon.style.padding = '0';
			this.readingIcon.title = 'Read selected text';
		}
	}

	// Show settings popup
	public showSettingsPopup(): void {
		if (!this.settingsPopup || !this.readingIcon) return;

		try {
			const iconRect: DOMRect = this.readingIcon.getBoundingClientRect();
			this.settingsPopup.style.left = `${iconRect.left + window.scrollX + 50}px`;
			this.settingsPopup.style.top = `${iconRect.top + window.scrollY}px`;
			this.settingsPopup.style.display = 'block';
		} catch (error) {
			console.error('Error showing settings popup:', error);
		}
	}

	// Hide settings popup
	public hideSettingsPopup(): void {
		if (this.settingsPopup) {
			this.settingsPopup.style.display = 'none';
		}
	}

	// Toggle settings popup
	public toggleSettingsPopup(): void {
		if (!this.settingsPopup) return;

		if (this.settingsPopup.style.display === 'none' || !this.settingsPopup.style.display) {
			this.showSettingsPopup();
		} else {
			this.hideSettingsPopup();
		}
	}

	// Load voices into dropdown
	public loadVoices(voices: SpeechSynthesisVoice[]): void {
		const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
		if (!voiceSelect) return;

		voiceSelect.innerHTML = '<option value="">Default</option>';

		voices.forEach((voice: SpeechSynthesisVoice): void => {
			const option: HTMLOptionElement = document.createElement('option');
			option.value = voice.name;
			option.textContent = `${voice.name} (${voice.lang})`;
			voiceSelect.appendChild(option);
		});
	}

	// Update settings UI
	public updateSettingsUI(settings: SpeechSettings): void {
		const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
		const speedValue = document.getElementById('speed-value') as HTMLSpanElement;
		const pitchSlider = document.getElementById('pitch-slider') as HTMLInputElement;
		const pitchValue = document.getElementById('pitch-value') as HTMLSpanElement;
		const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
		const volumeValue = document.getElementById('volume-value') as HTMLSpanElement;
		const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;

		if (speedSlider && speedValue) {
			speedSlider.value = settings.rate.toString();
			speedValue.textContent = `${settings.rate}x`;
		}

		if (pitchSlider && pitchValue) {
			pitchSlider.value = settings.pitch.toString();
			pitchValue.textContent = `${settings.pitch}x`;
		}

		if (volumeSlider && volumeValue) {
			volumeSlider.value = settings.volume.toString();
			volumeValue.textContent = `${Math.round(settings.volume * 100)}%`;
		}

		if (voiceSelect) {
			voiceSelect.value = settings.voice?.name || '';
		}
	}

	// Get settings popup element for drag functionality
	public getSettingsPopup(): HTMLDivElement | null {
		return this.settingsPopup;
	}

	// Highlight selected text with blue background
	public highlightSelectedText(range: Range): HTMLElement[] {
		try {
			console.log('Starting text highlighting...');
			this.clearHighlighting(); // Clear any previous highlighting
			
			const selectedElements: HTMLElement[] = [];
			
			// Clone the range to avoid modifying the original
			const workingRange = range.cloneRange();
			
			// Get the selected text for validation
			const selectedText = workingRange.toString();
			console.log('Selected text:', selectedText);
			
			if (!selectedText.trim()) {
				console.warn('No text selected for highlighting');
				return [];
			}
			
			// Use a different approach: wrap the selection without extracting
			const startContainer = workingRange.startContainer;
			const endContainer = workingRange.endContainer;
			
			console.log('Range details:', {
				startContainer: startContainer,
				endContainer: endContainer,
				startNodeType: startContainer.nodeType,
				endNodeType: endContainer.nodeType,
				isSameNode: startContainer === endContainer
			});
			
			// Simple case: selection within a single text node
			if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
				console.log('Simple single text node selection');
				this.highlightSingleTextNode(workingRange, selectedElements);
			} else {
				console.log('Complex multi-node selection');
				this.highlightComplexSelection(workingRange, selectedElements);
			}
			
			console.log('After processing, selectedElements count:', selectedElements.length);
			
			// Apply blue background to all highlighted elements
			selectedElements.forEach((element, index) => {
				element.style.backgroundColor = '#87CEEB'; // Light blue
				element.style.transition = 'background-color 0.3s ease';
				element.style.padding = '2px 1px';
				element.style.borderRadius = '2px';
				element.setAttribute('data-smart-reader', 'highlighted');
				element.setAttribute('data-word-index', index.toString());
			});
			
			this.highlightedElements = selectedElements;
			console.log('Highlighted elements count:', selectedElements.length);
			if (selectedElements.length > 0) {
				console.log('UI Components: highlightSelectedText completed successfully');
				this.debugHighlighting();
			} else {
				console.warn('UI Components: No elements were highlighted!');
			}
			return selectedElements;
		} catch (error) {
			console.error('Error highlighting text:', error);
			return [];
		}
	}
	
	// Handle highlighting for single text node selections
	private highlightSingleTextNode(range: Range, selectedElements: HTMLElement[]): void {
		const textNode = range.startContainer as Text;
		const startOffset = range.startOffset;
		const endOffset = range.endOffset;
		
		// Get the selected text
		const fullText = textNode.textContent || '';
		const beforeText = fullText.substring(0, startOffset);
		const selectedText = fullText.substring(startOffset, endOffset);
		const afterText = fullText.substring(endOffset);
		
		console.log('Text parts:', { beforeText, selectedText, afterText });
		
		// Split selected text into words
		const words = selectedText.split(/(\s+)/);
		console.log('Single text node - split words:', words.filter(w => w.trim().length > 0));
		const fragment = document.createDocumentFragment();
		
		// Add before text
		if (beforeText) {
			fragment.appendChild(document.createTextNode(beforeText));
		}
		
		// Add word spans
		words.forEach(word => {
			if (word.trim().length > 0) {
				const span = document.createElement('span');
				span.textContent = word;
				span.className = 'smart-reader-word';
				selectedElements.push(span);
				fragment.appendChild(span);
			} else if (word.length > 0) {
				fragment.appendChild(document.createTextNode(word));
			}
		});
		
		// Add after text
		if (afterText) {
			fragment.appendChild(document.createTextNode(afterText));
		}
		
		// Replace the text node with our fragment
		const parent = textNode.parentNode;
		if (parent) {
			console.log('Replacing text node with fragment containing', selectedElements.length, 'word elements');
			parent.replaceChild(fragment, textNode);
		} else {
			console.error('No parent node found for text node replacement!');
		}
	}
	
	// Handle highlighting for complex multi-node selections
	private highlightComplexSelection(range: Range, selectedElements: HTMLElement[]): void {
		console.log('Processing complex selection...');
		
		// For complex selections, we'll use the surroundContents approach with a wrapper
		try {
			const wrapper = document.createElement('div');
			wrapper.style.display = 'contents'; // Don't affect layout
			wrapper.className = 'smart-reader-selection-wrapper';
			
			// Clone contents instead of extracting
			const contents = range.cloneContents();
			
				// Process the cloned contents - need to iterate through fragment children
			const fragmentChildren = Array.from(contents.childNodes);
			console.log('Document fragment has', fragmentChildren.length, 'child nodes');
			
			// Process each child node of the document fragment
			fragmentChildren.forEach(child => {
				this.processNodeForHighlighting(child, wrapper as any, selectedElements);
			});
			
			console.log('Complex selection processed, created', selectedElements.length, 'word elements');
			
			// Replace the range contents
			range.deleteContents();
			range.insertNode(wrapper);
			
		} catch (error) {
			console.error('Error in complex selection highlighting:', error);
			// Fallback: try to get text and create simple spans
			this.fallbackHighlighting(range, selectedElements);
		}
	}
	
	// Fallback highlighting method
	private fallbackHighlighting(range: Range, selectedElements: HTMLElement[]): void {
		console.log('Using fallback highlighting method');
		
		const selectedText = range.toString();
		const words = selectedText.split(/\s+/).filter(word => word.trim().length > 0);
		
		// Create a simple wrapper span
		const wrapper = document.createElement('span');
		wrapper.style.display = 'contents';
		wrapper.className = 'smart-reader-fallback-wrapper';
		console.log('Fallback: Creating wrapper for', words.length, 'words:', words.slice(0, 5));
		
		words.forEach((word, index) => {
			const span = document.createElement('span');
			span.textContent = word;
			span.className = 'smart-reader-word';
			selectedElements.push(span);
			wrapper.appendChild(span);
			
			// Add space between words except for the last one
			if (index < words.length - 1) {
				wrapper.appendChild(document.createTextNode(' '));
			}
		});
		
		console.log('Fallback: Created', selectedElements.length, 'word elements');
		// Replace selection with wrapper
		range.deleteContents();
		range.insertNode(wrapper);
	}
	
	// Process nodes recursively to wrap words in spans
	private processNodeForHighlighting(node: Node, fragment: DocumentFragment, selectedElements: HTMLElement[]): void {
		console.log('Processing node:', node.nodeType, node.nodeName, node.textContent?.substring(0, 50));
		
		if (node.nodeType === 11) { // Node.DOCUMENT_FRAGMENT_NODE
			// Handle document fragments by processing their children
			console.log('Processing document fragment with', node.childNodes.length, 'children');
			Array.from(node.childNodes).forEach(child => {
				this.processNodeForHighlighting(child, fragment, selectedElements);
			});
		} else if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent || '';
			const words = text.split(/(\s+)/); // Split but keep whitespace
			console.log('Text node words:', words.filter(w => w.trim().length > 0));
			
			words.forEach(word => {
				if (word.trim().length > 0) {
					// Create span for actual words
					const span = document.createElement('span');
					span.textContent = word;
					span.className = 'smart-reader-word';
					selectedElements.push(span);
					fragment.appendChild(span);
				} else if (word.length > 0) {
					// Preserve whitespace as text nodes
					fragment.appendChild(document.createTextNode(word));
				}
			});
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			// For element nodes, clone and process children
			const element = node.cloneNode(false) as HTMLElement;
			const childNodes = Array.from(node.childNodes);
			console.log('Element node children:', childNodes.length);
			
			childNodes.forEach(child => {
				this.processNodeForHighlighting(child, element as any, selectedElements);
			});
			
			fragment.appendChild(element);
		} else {
			// For other node types, clone as is
			console.log('Other node type:', node.nodeType);
			fragment.appendChild(node.cloneNode(true));
		}
		console.log('Node processed, total elements so far:', selectedElements.length);
	}
	
	// Highlight current word being read (yellow background)
	public highlightCurrentWord(wordIndex: number): void {
		try {
			console.log(`Highlighting word ${wordIndex} of ${this.highlightedElements.length} words`);
			
			// Reset all words to blue
			this.highlightedElements.forEach((element) => {
				element.style.backgroundColor = '#87CEEB'; // Light blue
				element.style.fontWeight = 'normal';
			});
			
			// Highlight current word in yellow
			if (wordIndex >= 0 && wordIndex < this.highlightedElements.length) {
				const currentElement = this.highlightedElements[wordIndex];
				currentElement.style.backgroundColor = '#FFFF99'; // Light yellow
				currentElement.style.fontWeight = 'bold';
				currentElement.style.boxShadow = '0 0 3px rgba(255, 255, 0, 0.5)';
				
				console.log(`Highlighted word: "${currentElement.textContent}"`);
				
				// Scroll current word into view if needed
				currentElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center',
					inline: 'nearest'
				});
			} else {
				console.warn(`Word index ${wordIndex} is out of range (0-${this.highlightedElements.length - 1})`);
			}
		} catch (error) {
			console.error('Error highlighting current word:', error);
		}
	}
	
	// Clear all highlighting
	public clearHighlighting(): void {
		try {
			console.log('Clearing highlighting...');
			
			// Method 1: Remove highlighted spans and restore text
			const highlightedSpans = document.querySelectorAll('[data-smart-reader="highlighted"]');
			console.log('Found highlighted spans:', highlightedSpans.length);
			
			highlightedSpans.forEach(span => {
				const parent = span.parentNode;
				if (parent) {
					// Replace span with its text content
					const textNode = document.createTextNode(span.textContent || '');
					parent.replaceChild(textNode, span);
				}
			});
			
			// Method 2: Remove wrapper elements
			const wrappers = document.querySelectorAll('.smart-reader-selection-wrapper, .smart-reader-fallback-wrapper');
			console.log('Found wrapper elements:', wrappers.length);
			
			wrappers.forEach(wrapper => {
				const parent = wrapper.parentNode;
				if (parent) {
					// Move all child nodes to parent
					while (wrapper.firstChild) {
						parent.insertBefore(wrapper.firstChild, wrapper);
					}
					// Remove the wrapper
					parent.removeChild(wrapper);
				}
			});
			
			// Normalize all affected parents to merge text nodes
			const normalizeElements = document.querySelectorAll('p, div, span, article, section');
			normalizeElements.forEach(element => {
				if (element.normalize) {
					element.normalize();
				}
			});
			
			this.highlightedElements = [];
			console.log('Highlighting cleared');
		} catch (error) {
			console.error('Error clearing highlighting:', error);
		}
	}
	
	// Get total number of highlighted words
	public getHighlightedWordCount(): number {
		return this.highlightedElements.length;
	}
	
	// Get highlighted text content
	public getHighlightedText(): string {
		return this.highlightedElements.map(el => el.textContent).join(' ');
	}
	
	// Debug method to test highlighting
	public debugHighlighting(): void {
		console.log('=== Highlighting Debug Info ===');
		console.log('Highlighted elements count:', this.highlightedElements.length);
		console.log('Highlighted elements:', this.highlightedElements);
		console.log('All smart-reader elements:', document.querySelectorAll('[data-smart-reader="highlighted"]'));
		console.log('Text content:', this.getHighlightedText());
		console.log('==============================');
	}
	
	// Test method to simulate word highlighting
	public testWordHighlighting(): void {
		console.log('=== Testing Word Highlighting ===');
		if (this.highlightedElements.length === 0) {
			console.warn('No highlighted elements to test with!');
			return;
		}
		
		const totalWords = this.highlightedElements.length;
		console.log(`Testing highlighting with ${totalWords} words`);
		
		let currentIndex = 0;
		const testInterval = setInterval(() => {
			if (currentIndex >= totalWords) {
				clearInterval(testInterval);
				console.log('Word highlighting test completed');
				return;
			}
			
			this.highlightCurrentWord(currentIndex);
			currentIndex++;
		}, 500); // Highlight each word for 500ms
	}

	// Cleanup method
	public destroy(): void {
		this.clearHighlighting();
		this.readingIcon?.remove();
		this.progressBar?.remove();
		this.settingsPopup?.remove();
		
		this.readingIcon = null;
		this.progressBar = null;
		this.settingsPopup = null;
	}
}

// Export for use in other modules
window.UIComponents = UIComponents;