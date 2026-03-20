
 
const { Plugin, Notice, MarkdownView } = require('obsidian');

module.exports = class ForceReadingModePlugin extends Plugin {
  async onload() {
    this.enabled = false;

    // Add ribbon icon
    this.ribbonIconEl = this.addRibbonIcon('book-open', 'Toggle Force Reading Mode', () => {
      this.toggleForceReadingMode();
    });

    this.setIconOpacity(0.3);

    // Add command for toggle
    this.addCommand({
      id: 'toggle-force-reading-mode',
      name: 'Force Reading Mode (toggle)',
      callback: () => {
        this.toggleForceReadingMode();
      },
    });

    // Apply reading mode when a file is opened
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (!this.enabled) return;
        const leaf = this.app.workspace.getMostRecentLeaf();
        if (leaf?.view instanceof MarkdownView) {
          // Wait a tick to ensure view is ready
          setTimeout(() => {
            this.setLeafToReadingMode(leaf);
          }, 50); // 50ms delay is usually safe
        }
      })
    );
  }

  onunload() {
    new Notice('Force Reading Mode: Plugin unloaded');
  }

  toggleForceReadingMode() {
    this.enabled = !this.enabled;
    this.setIconOpacity(this.enabled ? 1 : 0.3);

    if (this.enabled) {
      this.setAllLeavesToReadingMode();
      new Notice('Force Reading Mode: ON');
    } else {
      new Notice('Force Reading Mode: OFF');
    }
  }

  setIconOpacity(opacity) {
    if (this.ribbonIconEl) {
      this.ribbonIconEl.style.opacity = opacity;
    }
  }

  setLeafToReadingMode(leaf) {
  if (!(leaf?.view instanceof MarkdownView)) return;

  const trySetPreview = (attempts = 5) => {
    if (attempts <= 0) return;

    const state = leaf.getViewState();

    // If it's already in preview, stop retrying
    if (state.state?.mode === 'preview') return;

    leaf.setViewState({
      ...state,
      state: {
        ...state.state,
        mode: 'preview',
      },
    });

    // Re-check after a short delay
    setTimeout(() => trySetPreview(attempts - 1), 100);
  };

  trySetPreview();
}



  setAllLeavesToReadingMode() {
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      this.setLeafToReadingMode(leaf);
    }
  }
};
