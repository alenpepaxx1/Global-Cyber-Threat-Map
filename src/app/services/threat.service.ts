import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export interface Attack {
  id: string;
  timestamp: number;
  sourceCountry: string;
  sourceCode: string;
  sourceLat: number;
  sourceLng: number;
  targetCountry: string;
  targetCode: string;
  targetLat: number;
  targetLng: number;
  type: string;
  color: string;
  port: number;
  ip: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States', lat: 38, lng: -97, weight: 100 },
  { code: 'CN', name: 'China', lat: 35, lng: 105, weight: 80 },
  { code: 'RU', name: 'Russia', lat: 60, lng: 100, weight: 70 },
  { code: 'BR', name: 'Brazil', lat: -10, lng: -55, weight: 40 },
  { code: 'IN', name: 'India', lat: 20, lng: 77, weight: 50 },
  { code: 'DE', name: 'Germany', lat: 51, lng: 9, weight: 60 },
  { code: 'GB', name: 'United Kingdom', lat: 55, lng: -3, weight: 60 },
  { code: 'FR', name: 'France', lat: 46, lng: 2, weight: 50 },
  { code: 'JP', name: 'Japan', lat: 36, lng: 138, weight: 40 },
  { code: 'KR', name: 'South Korea', lat: 36, lng: 128, weight: 30 },
  { code: 'IR', name: 'Iran', lat: 32, lng: 53, weight: 40 },
  { code: 'KP', name: 'North Korea', lat: 40, lng: 127, weight: 30 },
  { code: 'UA', name: 'Ukraine', lat: 48, lng: 31, weight: 40 },
  { code: 'IL', name: 'Israel', lat: 31, lng: 34, weight: 30 },
  { code: 'ZA', name: 'South Africa', lat: -30, lng: 25, weight: 20 },
  { code: 'AU', name: 'Australia', lat: -25, lng: 133, weight: 30 },
  { code: 'CA', name: 'Canada', lat: 60, lng: -95, weight: 40 },
  { code: 'MX', name: 'Mexico', lat: 23, lng: -102, weight: 30 },
  { code: 'IT', name: 'Italy', lat: 42, lng: 12, weight: 30 },
  { code: 'ES', name: 'Spain', lat: 40, lng: -4, weight: 30 },
  { code: 'NL', name: 'Netherlands', lat: 52, lng: 5, weight: 40 },
  { code: 'SE', name: 'Sweden', lat: 60, lng: 15, weight: 20 },
  { code: 'CH', name: 'Switzerland', lat: 47, lng: 8, weight: 20 },
  { code: 'SG', name: 'Singapore', lat: 1.3, lng: 103.8, weight: 30 },
  { code: 'TW', name: 'Taiwan', lat: 23.5, lng: 121, weight: 30 },
  { code: 'VN', name: 'Vietnam', lat: 14, lng: 108, weight: 20 },
  { code: 'TR', name: 'Turkey', lat: 39, lng: 35, weight: 30 },
  { code: 'SA', name: 'Saudi Arabia', lat: 25, lng: 45, weight: 20 },
  { code: 'AE', name: 'United Arab Emirates', lat: 24, lng: 54, weight: 20 },
  { code: 'NG', name: 'Nigeria', lat: 10, lng: 8, weight: 10 },
  { code: 'EG', name: 'Egypt', lat: 26, lng: 30, weight: 10 },
  { code: 'AR', name: 'Argentina', lat: -34, lng: -64, weight: 20 },
  { code: 'CO', name: 'Colombia', lat: 4, lng: -72, weight: 10 },
  { code: 'CL', name: 'Chile', lat: -35, lng: -71, weight: 10 },
  { code: 'PE', name: 'Peru', lat: -10, lng: -76, weight: 10 },
  { code: 'VE', name: 'Venezuela', lat: 8, lng: -66, weight: 10 },
  { code: 'PK', name: 'Pakistan', lat: 30, lng: 70, weight: 20 },
  { code: 'BD', name: 'Bangladesh', lat: 24, lng: 90, weight: 10 },
  { code: 'ID', name: 'Indonesia', lat: -5, lng: 120, weight: 20 },
  { code: 'PH', name: 'Philippines', lat: 13, lng: 122, weight: 10 },
  { code: 'TH', name: 'Thailand', lat: 15, lng: 100, weight: 10 },
  { code: 'MY', name: 'Malaysia', lat: 4, lng: 109, weight: 10 },
  { code: 'NZ', name: 'New Zealand', lat: -40, lng: 174, weight: 10 },
  { code: 'PL', name: 'Poland', lat: 52, lng: 20, weight: 20 },
  { code: 'RO', name: 'Romania', lat: 46, lng: 25, weight: 10 },
  { code: 'GR', name: 'Greece', lat: 39, lng: 22, weight: 10 },
  { code: 'PT', name: 'Portugal', lat: 39, lng: -8, weight: 10 },
  { code: 'CZ', name: 'Czechia', lat: 50, lng: 15, weight: 10 },
  { code: 'HU', name: 'Hungary', lat: 47, lng: 20, weight: 10 },
  { code: 'AT', name: 'Austria', lat: 47, lng: 13, weight: 10 },
  { code: 'BE', name: 'Belgium', lat: 50, lng: 4, weight: 10 },
  { code: 'DK', name: 'Denmark', lat: 56, lng: 10, weight: 10 },
  { code: 'FI', name: 'Finland', lat: 64, lng: 26, weight: 10 },
  { code: 'NO', name: 'Norway', lat: 62, lng: 10, weight: 10 },
  { code: 'IE', name: 'Ireland', lat: 53, lng: -8, weight: 10 },
];

const ATTACK_TYPES = [
  { name: 'DDoS', color: '#ff3333', port: 80 },
  { name: 'SQL Injection', color: '#33ff33', port: 3306 },
  { name: 'SSH Brute Force', color: '#3333ff', port: 22 },
  { name: 'Malware', color: '#ff33ff', port: 443 },
  { name: 'Phishing', color: '#ffff33', port: 25 },
  { name: 'Ransomware', color: '#ff9933', port: 445 },
  { name: 'Botnet', color: '#33ffff', port: 8080 },
  { name: 'Exploit', color: '#ff3399', port: 80 },
  { name: 'Scan', color: '#99ff33', port: 0 },
];

@Injectable({
  providedIn: 'root'
})
export class ThreatService implements OnDestroy {
  attacks = signal<Attack[]>([]);
  
  // Active attacks currently visualized (within last 1.5s)
  activeAttacksCount = computed(() => {
    const now = Date.now();
    return this.attacks().filter(a => now - a.timestamp <= 1500).length;
  });
  
  // Stats
  topAttackers = computed(() => {
    const counts = new Map<string, number>();
    for (const attack of this.attacks()) {
      counts.set(attack.sourceCountry, (counts.get(attack.sourceCountry) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  topTargets = computed(() => {
    const counts = new Map<string, number>();
    for (const attack of this.attacks()) {
      counts.set(attack.targetCountry, (counts.get(attack.targetCountry) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  topTypes = computed(() => {
    const counts = new Map<string, { count: number, color: string }>();
    for (const attack of this.attacks()) {
      const current = counts.get(attack.type) || { count: 0, color: attack.color };
      counts.set(attack.type, { count: current.count + 1, color: attack.color });
    }
    return Array.from(counts.entries())
      .map(([name, data]) => ({ name, count: data.count, color: data.color }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  private intervalId: ReturnType<typeof setTimeout> | undefined;
  private totalWeight = COUNTRIES.reduce((sum, c) => sum + c.weight, 0);

  constructor() {
    this.startSimulation();
  }

  private getRandomCountry() {
    let r = Math.random() * this.totalWeight;
    for (const c of COUNTRIES) {
      if (r < c.weight) return c;
      r -= c.weight;
    }
    return COUNTRIES[0];
  }

  private generateAttack(): Attack {
    const source = this.getRandomCountry();
    let target = this.getRandomCountry();
    while (source.code === target.code) {
      target = this.getRandomCountry();
    }

    const type = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
    const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    // Add some jitter to lat/lng so they don't all originate from the exact same point
    const sourceLat = source.lat + (Math.random() * 4 - 2);
    const sourceLng = source.lng + (Math.random() * 4 - 2);
    const targetLat = target.lat + (Math.random() * 4 - 2);
    const targetLng = target.lng + (Math.random() * 4 - 2);

    return {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      sourceCountry: source.name,
      sourceCode: source.code,
      sourceLat,
      sourceLng,
      targetCountry: target.name,
      targetCode: target.code,
      targetLat,
      targetLng,
      type: type.name,
      color: type.color,
      port: type.port,
      ip
    };
  }

  private startSimulation() {
    // Generate initial batch
    const initial = [];
    for (let i = 0; i < 50; i++) {
      initial.push(this.generateAttack());
    }
    this.attacks.set(initial);

    // Continuous generation
    const loop = () => {
      const newAttack = this.generateAttack();
      this.attacks.update(attacks => {
        const updated = [newAttack, ...attacks];
        if (updated.length > 200) {
          updated.length = 200; // Keep last 200
        }
        return updated;
      });
      
      // Random interval between 50ms and 800ms
      this.intervalId = setTimeout(loop, 50 + Math.random() * 750);
    };
    
    loop();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
  }
}
