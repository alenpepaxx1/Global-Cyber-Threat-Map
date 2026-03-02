import { Component, ElementRef, ViewChild, effect, inject, OnInit, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ThreatService, Attack } from '../../services/threat.service';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

@Component({
  selector: 'app-threat-map',
  standalone: true,
  imports: [DatePipe, MatIconModule],
  template: `
    <div class="w-full h-full relative overflow-hidden bg-[#0a0f18]">
      <div class="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style="background-image: linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px); background-size: 40px 40px;">
      </div>
      <div #mapContainer class="w-full h-full relative z-10"></div>
      
      <!-- Canvas for optimized attack rendering -->
      <canvas #canvasContainer class="absolute inset-0 z-20 pointer-events-none w-full h-full"></canvas>

      <!-- Loading Overlay -->
      @if (isLoading()) {
        <div class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0f18]/80 backdrop-blur-sm">
          <div class="relative flex h-12 w-12 mb-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></span>
            <span class="relative inline-flex rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent animate-spin"></span>
          </div>
          <div class="text-blue-400 font-mono text-sm tracking-widest uppercase animate-pulse">Initializing Global Grid...</div>
        </div>
      }

      <!-- Tooltip -->
      @if (hoveredCountry()) {
        <div class="fixed z-30 bg-slate-900/90 backdrop-blur border border-slate-700 text-white p-3 rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px]"
             [style.left.px]="tooltipX()" [style.top.px]="tooltipY()">
          <div class="font-bold text-sm mb-1">{{ hoveredCountry() }}</div>
          <div class="text-xs text-slate-300">
            <div>Outbound: <span class="text-red-400 font-mono">{{ countryStats().source }}</span></div>
            <div>Inbound: <span class="text-blue-400 font-mono">{{ countryStats().target }}</span></div>
          </div>
        </div>
      }

      <!-- Modal -->
      @if (selectedCountry()) {
        <div class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div class="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <mat-icon class="text-blue-500">public</mat-icon>
                Threat Intelligence: {{ selectedCountry() }}
              </h2>
              <button (click)="selectedCountry.set(null)" class="text-slate-400 hover:text-white transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div class="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Outbound</div>
                  <div class="text-2xl font-mono text-red-400">{{ selectedCountryStats().source }}</div>
                </div>
                <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div class="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Inbound</div>
                  <div class="text-2xl font-mono text-blue-400">{{ selectedCountryStats().target }}</div>
                </div>
              </div>
              
              <h3 class="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Recent Activity</h3>
              <div class="space-y-2">
                @for (attack of selectedCountryAttacks(); track attack.id) {
                  <div class="bg-slate-800/30 p-3 rounded border border-slate-700/30 text-xs font-mono flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                    <div class="flex items-center gap-3">
                      <span class="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" [style.backgroundColor]="attack.color" [style.boxShadow]="'0 0 8px ' + attack.color"></span>
                      <span class="text-slate-200 font-bold w-24 truncate">{{ attack.type }}</span>
                    </div>
                    <div class="text-slate-400 flex-1 text-center">
                      @if (attack.sourceCountry === selectedCountry()) {
                        <span class="text-red-400">OUT</span> → {{ attack.targetCountry }}
                      } @else {
                        <span class="text-blue-400">IN</span> ← {{ attack.sourceCountry }}
                      }
                    </div>
                    <div class="text-slate-500 w-20 text-right">{{ attack.timestamp | date:'HH:mm:ss' }}</div>
                  </div>
                }
                @if (selectedCountryAttacks().length === 0) {
                  <div class="text-slate-500 text-sm italic text-center py-4">No recent activity recorded.</div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
  `]
})
export class ThreatMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLCanvasElement>;
  
  private threatService = inject(ThreatService);
  private platformId = inject(PLATFORM_ID);
  
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
  private projection: d3.GeoProjection | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private path: d3.GeoPath<any, d3.GeoPermissibleObjects> | undefined;
  private g: d3.Selection<SVGGElement, unknown, null, undefined> | undefined;
  private width = 0;
  private height = 0;
  private resizeObserver: ResizeObserver | undefined;

  // Canvas properties
  private ctx: CanvasRenderingContext2D | null = null;
  private currentTransform: d3.ZoomTransform = d3.zoomIdentity;
  private animationFrameId: number | null = null;
  private activeAttacks: {
    attack: Attack;
    startTime: number;
    duration: number;
    sourcePos: [number, number];
    targetPos: [number, number];
    controlPos: [number, number];
  }[] = [];

  // UI State
  isLoading = signal(true);
  hoveredCountry = signal<string | null>(null);
  tooltipX = signal(0);
  tooltipY = signal(0);
  countryStats = signal({ source: 0, target: 0 });
  
  selectedCountry = signal<string | null>(null);
  selectedCountryStats = signal({ source: 0, target: 0 });
  selectedCountryAttacks = signal<Attack[]>([]);

  constructor() {
    effect(() => {
      const attacks = this.threatService.attacks();
      if (attacks.length > 0 && this.projection && isPlatformBrowser(this.platformId)) {
        this.queueAttackAnimation(attacks[0]);
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
      this.loadWorldData();
      this.startCanvasLoop();
      
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.animationFrameId !== null && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private initMap() {
    const container = this.mapContainer.nativeElement;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0') as d3.Selection<SVGSVGElement, unknown, null, undefined>;

    this.g = this.svg.append('g');

    this.projection = d3.geoMercator()
      .scale((this.width / 2 / Math.PI) * 1.2)
      .translate([this.width / 2, this.height / 1.5]);

    this.path = d3.geoPath().projection(this.projection);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .wheelDelta((event: WheelEvent) => {
        // Reduce the default delta multiplier for finer, more sensitive zoom control
        return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * 0.3;
      })
      .on('zoom', (event) => {
        if (this.g) {
          this.g.attr('transform', event.transform);
        }
        this.currentTransform = event.transform;
      });

    this.svg.call(zoom);
  }

  private resize() {
    const container = this.mapContainer.nativeElement;
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    
    const canvas = this.canvasContainer.nativeElement;
    canvas.width = this.width;
    canvas.height = this.height;
    
    if (this.projection && this.g && this.path) {
      this.projection
        .scale((this.width / 2 / Math.PI) * 1.2)
        .translate([this.width / 2, this.height / 1.5]);
        
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.g.selectAll('path.country').attr('d', this.path as any);
    }
  }

  private async loadWorldData() {
    try {
      this.isLoading.set(true);
      const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      const world = await response.json();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countries = topojson.feature(world as any, world.objects['countries'] as any) as unknown as GeoJSON.FeatureCollection;

      if (this.g && this.path) {
        this.g.selectAll('path.country')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('class', 'country')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr('d', this.path as any)
          .attr('fill', '#1a2639')
          .attr('stroke', '#2c3e50')
          .attr('stroke-width', 0.5)
          .style('cursor', 'pointer')
          .style('transition', 'fill 0.2s, stroke 0.2s')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('mouseenter', (event: MouseEvent, d: any) => {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             d3.select(event.currentTarget as any)
               .attr('fill', '#2c3e50')
               .attr('stroke', '#475569')
               .attr('stroke-width', 1);
               
             const countryName = d.properties?.['name'];
             if (countryName) {
               this.hoveredCountry.set(countryName);
               this.tooltipX.set(event.clientX);
               this.tooltipY.set(event.clientY);
               
               const attacks = this.threatService.attacks();
               const source = attacks.filter(a => a.sourceCountry === countryName).length;
               const target = attacks.filter(a => a.targetCountry === countryName).length;
               this.countryStats.set({ source, target });
             }
          })
          .on('mousemove', (event: MouseEvent) => {
             this.tooltipX.set(event.clientX);
             this.tooltipY.set(event.clientY);
          })
          .on('mouseleave', (event: MouseEvent) => {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             d3.select(event.currentTarget as any)
               .attr('fill', '#1a2639')
               .attr('stroke', '#2c3e50')
               .attr('stroke-width', 0.5);
             this.hoveredCountry.set(null);
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('click', (event: MouseEvent, d: any) => {
             const countryName = d.properties?.['name'];
             if (countryName) {
               this.selectedCountry.set(countryName);
               
               const attacks = this.threatService.attacks();
               const source = attacks.filter(a => a.sourceCountry === countryName).length;
               const target = attacks.filter(a => a.targetCountry === countryName).length;
               this.selectedCountryStats.set({ source, target });
               
               this.selectedCountryAttacks.set(
                 attacks.filter(a => a.sourceCountry === countryName || a.targetCountry === countryName).slice(0, 50)
               );
             }
          });
      }
        
    } catch (error) {
      console.error('Error loading world data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private queueAttackAnimation(attack: Attack) {
    if (!this.projection) return;

    const sourcePos = this.projection([attack.sourceLng, attack.sourceLat]);
    const targetPos = this.projection([attack.targetLng, attack.targetLat]);

    if (!sourcePos || !targetPos) return;

    const dx = targetPos[0] - sourcePos[0];
    const dy = targetPos[1] - sourcePos[1];
    const dr = Math.sqrt(dx * dx + dy * dy);
    
    const midX = (sourcePos[0] + targetPos[0]) / 2;
    const midY = (sourcePos[1] + targetPos[1]) / 2;
    
    // Normal vector
    const nx = -dy / dr;
    const ny = dx / dr;
    
    // Control point offset (curve height)
    const offset = dr * 0.3;
    const controlPos: [number, number] = [midX + nx * offset, midY + ny * offset];

    this.activeAttacks.push({
      attack,
      startTime: Date.now(),
      duration: 1500, // 1.5s animation
      sourcePos: [sourcePos[0], sourcePos[1]],
      targetPos: [targetPos[0], targetPos[1]],
      controlPos
    });
    
    // Keep array size manageable
    if (this.activeAttacks.length > 300) {
      this.activeAttacks.shift();
    }
  }

  private startCanvasLoop() {
    const canvas = this.canvasContainer.nativeElement;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d');
    
    const render = () => {
      if (!this.ctx) return;
      
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const now = Date.now();
      
      this.ctx.save();
      this.ctx.translate(this.currentTransform.x, this.currentTransform.y);
      this.ctx.scale(this.currentTransform.k, this.currentTransform.k);
      
      // Use global composite operation for better glow effect
      this.ctx.globalCompositeOperation = 'lighter';
      
      for (let i = this.activeAttacks.length - 1; i >= 0; i--) {
        const anim = this.activeAttacks[i];
        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        
        if (progress >= 1) {
          // Draw target blip fading out
          const blipProgress = (elapsed - anim.duration) / 1000; // 1s fade
          if (blipProgress <= 1) {
            this.drawBlip(anim.targetPos, anim.attack.color, blipProgress);
          } else {
             this.activeAttacks.splice(i, 1);
          }
          continue;
        }
        
        this.drawArc(anim, progress);
      }
      
      this.ctx.restore();
      
      this.animationFrameId = requestAnimationFrame(render);
    };
    
    render();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private drawArc(anim: any, progress: number) {
    if (!this.ctx) return;
    
    const { sourcePos, targetPos, controlPos, attack } = anim;
    
    // Current position along quadratic bezier
    const t = progress;
    const x = Math.pow(1 - t, 2) * sourcePos[0] + 2 * (1 - t) * t * controlPos[0] + Math.pow(t, 2) * targetPos[0];
    const y = Math.pow(1 - t, 2) * sourcePos[1] + 2 * (1 - t) * t * controlPos[1] + Math.pow(t, 2) * targetPos[1];
    
    // Draw full path faint
    this.ctx.beginPath();
    this.ctx.moveTo(sourcePos[0], sourcePos[1]);
    this.ctx.quadraticCurveTo(controlPos[0], controlPos[1], targetPos[0], targetPos[1]);
    this.ctx.strokeStyle = attack.color;
    this.ctx.globalAlpha = 0.15;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Draw active segment (approximate by drawing from source to current point)
    const partialControlX = sourcePos[0] + t * (controlPos[0] - sourcePos[0]);
    const partialControlY = sourcePos[1] + t * (controlPos[1] - sourcePos[1]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(sourcePos[0], sourcePos[1]);
    this.ctx.quadraticCurveTo(partialControlX, partialControlY, x, y);
    this.ctx.globalAlpha = 0.8;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = attack.color;
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
    
    // Draw head particle
    this.ctx.beginPath();
    this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
    
    // Draw source blip
    this.ctx.beginPath();
    this.ctx.arc(sourcePos[0], sourcePos[1], 2, 0, Math.PI * 2);
    this.ctx.fillStyle = attack.color;
    this.ctx.fill();
  }

  private drawBlip(pos: [number, number], color: string, progress: number) {
    if (!this.ctx || progress >= 1) return;
    
    const radius = 2 + progress * 20;
    const opacity = 1 - progress;
    
    this.ctx.beginPath();
    this.ctx.arc(pos[0], pos[1], radius, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = opacity;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
}
