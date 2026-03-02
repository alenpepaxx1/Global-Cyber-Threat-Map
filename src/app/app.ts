import {ChangeDetectionStrategy, Component, OnInit, OnDestroy, PLATFORM_ID, inject} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {ThreatMapComponent} from './components/threat-map/threat-map.component';
import {ThreatLogComponent} from './components/threat-log/threat-log.component';
import {ThreatStatsComponent} from './components/threat-stats/threat-stats.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [ThreatMapComponent, ThreatLogComponent, ThreatStatsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private observer: MutationObserver | null = null;
  private footerElement: HTMLElement | null = null;
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.enforceFooter();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private enforceFooter() {
    const createFooter = () => {
      const el = document.createElement('div');
      el.id = 'protected-footer';
      el.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="position: relative; display: flex; width: 6px; height: 6px;">
            <span class="animate-ping" style="position: absolute; display: inline-flex; height: 100%; width: 100%; border-radius: 50%; background-color: #3b82f6; opacity: 0.75;"></span>
            <span style="position: relative; display: inline-flex; border-radius: 50%; height: 6px; width: 6px; background-color: #3b82f6; box-shadow: 0 0 8px #3b82f6;"></span>
          </div>
          <span style="letter-spacing: 0.15em; text-shadow: 0 0 10px rgba(148, 163, 184, 0.3);">BUILT BY ALEN PEPA</span>
        </div>
      `;
      el.style.cssText = `
        position: fixed !important;
        bottom: 24px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        user-select: none !important;
        font-size: 0.65rem !important;
        font-weight: 700 !important;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
        color: #e2e8f0 !important;
        background: rgba(15, 23, 42, 0.75) !important;
        padding: 8px 16px !important;
        border-radius: 9999px !important;
        border: 1px solid rgba(51, 65, 85, 0.6) !important;
        border-top: 1px solid rgba(71, 85, 105, 0.6) !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(12px) !important;
        display: block !important;
        visibility: visible !important;
        text-transform: uppercase !important;
      `;
      return el;
    };

    this.footerElement = createFooter();
    document.body.appendChild(this.footerElement);

    this.observer = new MutationObserver((mutations) => {
      let needsRestore = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node === this.footerElement) {
              needsRestore = true;
            }
          });
        } else if (mutation.type === 'attributes' && mutation.target === this.footerElement) {
          needsRestore = true;
        } else if (mutation.type === 'characterData' && mutation.target.parentNode === this.footerElement) {
          needsRestore = true;
        }
      }

      if (needsRestore) {
        this.observer?.disconnect();
        if (this.footerElement && this.footerElement.parentNode) {
          this.footerElement.parentNode.removeChild(this.footerElement);
        }
        this.footerElement = createFooter();
        document.body.appendChild(this.footerElement);
        this.observer?.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }
}
