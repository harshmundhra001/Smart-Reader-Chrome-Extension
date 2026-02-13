// Drag Handler Module - TypeScript
// Handles dragging functionality for UI elements

interface DragOffset {
	x: number;
	y: number;
}

class DragHandler {
	private isDragging: boolean = false;
	private dragOffset: DragOffset = { x: 0, y: 0 };
	private dragElement: HTMLElement | null = null;
	private boundMouseMove: (e: MouseEvent) => void;
	private boundMouseUp: () => void;

	constructor() {
		// Bind methods to maintain context
		this.boundMouseMove = this.drag.bind(this);
		this.boundMouseUp = this.stopDrag.bind(this);
	}

	// Initialize drag functionality for an element
	public initDrag(element: HTMLElement, dragHandle?: HTMLElement | null): void {
		if (!element) {
			console.error('Cannot initialize drag: element is null or undefined');
			return;
		}

		const handle: HTMLElement = dragHandle || element;
		
		handle.addEventListener('mousedown', (e: MouseEvent) => this.startDrag(e, element));
		document.addEventListener('mousemove', this.boundMouseMove);
		document.addEventListener('mouseup', this.boundMouseUp);
	}

	// Start dragging
	private startDrag(e: MouseEvent, element: HTMLElement): void {
		// Check if the click target is within the drag handle
		const target = e.target as HTMLElement;
		if (target.closest('#settings-header') || target === element) {
			this.isDragging = true;
			this.dragElement = element;
			
			try {
				const rect: DOMRect = element.getBoundingClientRect();
				this.dragOffset.x = e.clientX - rect.left;
				this.dragOffset.y = e.clientY - rect.top;
				
				element.style.cursor = 'grabbing';
				e.preventDefault();
				e.stopPropagation();
			} catch (error) {
				console.error('Error starting drag:', error);
				this.isDragging = false;
				this.dragElement = null;
			}
		}
	}

	// Handle dragging
	private drag(e: MouseEvent): void {
		if (!this.isDragging || !this.dragElement) return;

		try {
			const x: number = e.clientX - this.dragOffset.x;
			const y: number = e.clientY - this.dragOffset.y;

			// Keep element within viewport with safety margins
			const elementWidth: number = this.dragElement.offsetWidth || 0;
			const elementHeight: number = this.dragElement.offsetHeight || 0;
			
			const maxX: number = Math.max(0, window.innerWidth - elementWidth);
			const maxY: number = Math.max(0, window.innerHeight - elementHeight);

			const boundedX: number = Math.max(0, Math.min(x, maxX));
			const boundedY: number = Math.max(0, Math.min(y, maxY));

			this.dragElement.style.left = `${boundedX}px`;
			this.dragElement.style.top = `${boundedY}px`;
		} catch (error) {
			console.error('Error during drag:', error);
			this.stopDrag();
		}
	}

	// Stop dragging
	private stopDrag(): void {
		if (this.isDragging && this.dragElement) {
			try {
				this.dragElement.style.cursor = 'move';
			} catch (error) {
				console.error('Error stopping drag:', error);
			}
		}
		
		this.isDragging = false;
		this.dragElement = null;
	}

	// Check if currently dragging
	public get IsDragging(): boolean {
		return this.isDragging;
	}

	// Get current drag element
	public get CurrentDragElement(): HTMLElement | null {
		return this.dragElement;
	}

	// Force stop dragging (useful for cleanup)
	public forceStopDrag(): void {
		this.stopDrag();
	}

	// Remove event listeners (cleanup method)
	public destroy(): void {
		document.removeEventListener('mousemove', this.boundMouseMove);
		document.removeEventListener('mouseup', this.boundMouseUp);
		this.forceStopDrag();
	}

	// Set custom boundaries for dragging
	public setBoundaries(minX: number, minY: number, maxX: number, maxY: number): void {
		// This could be extended to support custom boundaries
		// For now, we use viewport boundaries in the drag method
		console.log('Custom boundaries support can be added here:', { minX, minY, maxX, maxY });
	}

	// Enable/disable dragging
	public setEnabled(enabled: boolean): void {
		if (!enabled) {
			this.forceStopDrag();
		}
		// Additional logic to enable/disable can be added here
	}
}

// Export for use in other modules
window.DragHandler = DragHandler;