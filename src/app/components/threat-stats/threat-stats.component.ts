import { Component, inject } from '@angular/core';
import { ThreatService } from '../../services/threat.service';

@Component({
  selector: 'app-threat-stats',
  standalone: true,
  template: `
    <div class="h-full flex flex-col gap-4">
      <!-- Active Attacks Counter -->
      <div class="bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </div>
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Threats</h3>
        </div>
        <div class="text-3xl font-mono font-bold text-white tracking-widest">
          {{ activeAttacksCount() }}
        </div>
      </div>

      <!-- Top Attackers -->
      <div class="flex-1 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Top Attack Sources
        </h3>
        <div class="space-y-3">
          @for (item of topAttackers(); track item.name) {
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300">{{ item.name }}</span>
                <span class="text-slate-500 font-mono">{{ item.count }}</span>
              </div>
              <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-red-500/80 rounded-full transition-all duration-500 ease-out"
                     [style.width]="(item.count / topAttackers()[0].count * 100) + '%'"></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Top Targets -->
      <div class="flex-1 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Top Targeted Countries
        </h3>
        <div class="space-y-3">
          @for (item of topTargets(); track item.name) {
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300">{{ item.name }}</span>
                <span class="text-slate-500 font-mono">{{ item.count }}</span>
              </div>
              <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500/80 rounded-full transition-all duration-500 ease-out"
                     [style.width]="(item.count / topTargets()[0].count * 100) + '%'"></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Attack Types -->
      <div class="flex-1 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Attack Vectors
        </h3>
        <div class="space-y-3">
          @for (item of topTypes(); track item.name) {
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-slate-300">{{ item.name }}</span>
                <span class="text-slate-500 font-mono">{{ item.count }}</span>
              </div>
              <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ease-out"
                     [style.background-color]="item.color"
                     [style.width]="(item.count / topTypes()[0].count * 100) + '%'"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class ThreatStatsComponent {
  private threatService = inject(ThreatService);
  activeAttacksCount = this.threatService.activeAttacksCount;
  topAttackers = this.threatService.topAttackers;
  topTargets = this.threatService.topTargets;
  topTypes = this.threatService.topTypes;
}
