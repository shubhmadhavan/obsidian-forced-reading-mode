const { Plugin, Notice, MarkdownView, setIcon } = require('obsidian');

module.exports = class ForceReadingModePlugin extends Plugin {
  async onload() {
    this.enabled = false;

    // Add ribbon icon (default OFF state)
    this.ribbonIconEl = this.addRibbonIcon(
      'book-open',
      'Toggle Force Reading Mode',
      () => {
        this.toggleForceReadingMode();
      }
    );

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
      this.app.workspace.on('file-open', () => {
        if (!this.enabled) return;
        const leaf = this.app.workspace.getMostRecentLeaf();
        if (leaf?.view instanceof MarkdownView) {
          this.setLeafToReadingMode(leaf);
        }
      })
    );

    // Apply when active leaf changes
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (!this.enabled) return;
        if (leaf?.view instanceof MarkdownView) {
          this.setLeafToReadingMode(leaf);
        }
      })
    );

    // Catch layout changes
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        if (this.enabled) {
          this.setAllLeavesToReadingMode();
        }
      })
    );
  }

  onunload() {
    new Notice('Force Reading Mode: Plugin unloaded');
  }

  toggleForceReadingMode() {
    this.enabled = !this.enabled;

    this.updateRibbonIcon(); // 👈 update icon

    if (this.enabled) {
      this.setAllLeavesToReadingMode();
    } else {
      this.setAllLeavesToSourceMode();
    }
  }

  updateRibbonIcon() {
  if (!this.ribbonIconEl) return;

  const icon = this.enabled ? 'book' : 'book-open';
  setIcon(this.ribbonIconEl, icon);
}

  setLeafToReadingMode(leaf) {
    if (!(leaf?.view instanceof MarkdownView)) return;

    const trySetPreview = (attempts = 10) => {
      if (attempts <= 0) return;

      const state = leaf.getViewState();

      if (state.state?.mode === 'preview') return;

      leaf.setViewState({
        ...state,
        state: {
          ...state.state,
          mode: 'preview',
        },
      });

      setTimeout(() => trySetPreview(attempts - 1), 200);
    };

    trySetPreview();
  }

  setLeafToSourceMode(leaf) {
    if (!(leaf?.view instanceof MarkdownView)) return;

    const state = leaf.getViewState();

    if (state.state?.mode === 'source') return;

    leaf.setViewState({
      ...state,
      state: {
        ...state.state,
        mode: 'source',
      },
    });
  }

  setAllLeavesToReadingMode() {
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      this.setLeafToReadingMode(leaf);
    }
  }

  setAllLeavesToSourceMode() {
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      this.setLeafToSourceMode(leaf);
    }
  }
};