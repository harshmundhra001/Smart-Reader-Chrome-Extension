// Chrome Extension API Type Definitions
// Basic types needed for Smart Reader extension

declare namespace chrome {
  namespace runtime {
    function getURL(path: string): string;
  }
}

// Global chrome object
declare const chrome: typeof chrome;