import { Component, inject } from '@angular/core';
import { ThreatService } from '../../services/threat.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-threat-log',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="h-full flex flex-col bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h2 class="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Threat Log
        </h2>
        <span class="text-xs font-mono text-slate-500">{{ attacks().length }} events</span>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        @for (attack of attacks(); track attack.id) {
          <div class="text-xs font-mono p-2 rounded hover:bg-slate-800/50 transition-colors border-l-2"
               [style.border-left-color]="attack.color">
            <div class="flex justify-between items-start mb-1">
              <span class="text-slate-400">{{ attack.timestamp | date:'HH:mm:ss.SSS' }}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" 
                    [style.color]="attack.color" 
                    [style.background-color]="attack.color + '20'">
                {{ attack.type }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-slate-300">
              <span class="truncate w-20" [title]="attack.sourceCountry">{{ attack.sourceCountry }}</span>
              <span class="text-slate-600">→</span>
              <span class="truncate w-20" [title]="attack.targetCountry">{{ attack.targetCountry }}</span>
            </div>
            <div class="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>IP: {{ attack.ip }}</span>
              <span>PORT: {{ attack.port }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
  `]
})
export class ThreatLogComponent {
  private threatService = inject(ThreatService);
  attacks = this.threatService.attacks;
}
