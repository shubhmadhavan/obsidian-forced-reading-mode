const { Plugin, Notice, MarkdownView } = require('obsidian');

module.exports = class ForceReadingModePlugin extends Plugin {
  async onload() {
    this.enabled = false;

    // Add ribbon icon
    this.ribbonIconEl = this.addRibbonIcon(
      'book-open',
      'Toggle Force Reading Mode',
      () => {
        this.toggleForceReadingMode();
      }
    );

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
          this.setLeafToReadingMode(leaf);
        }
      })
    );

    // Also apply when active leaf changes (new panes/tabs etc.)
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (!this.enabled) return;
        if (leaf?.view instanceof MarkdownView) {
          this.setLeafToReadingMode(leaf);
        }
      })
    );

    // Catch late layout changes (new views created after startup)
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
    this.setIconOpacity(this.enabled ? 1 : 0.3);

    if (this.enabled) {
      this.setAllLeavesToReadingMode();
      //new Notice('Force Reading Mode: ON');
    } else {
      this.setAllLeavesToSourceMode(); // 👈 revert back
      //new Notice('Force Reading Mode: OFF');
    }
  }

  setIconOpacity(opacity) {
    if (this.ribbonIconEl) {
      this.ribbonIconEl.style.opacity = opacity;
    }
  }

  setLeafToReadingMode(leaf) {
    if (!(leaf?.view instanceof MarkdownView)) return;

    const trySetPreview = (attempts = 10) => {
      if (attempts <= 0) return;

      const state = leaf.getViewState();

      if (state.state?.mode === 'preview') return; // already in reading

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

    if (state.state?.mode === 'source') return; // already in editing

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
