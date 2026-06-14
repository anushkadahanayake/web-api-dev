import os from 'os';

export interface SystemDiagnostics {
  nodeVersion: string;
  platform: string;
  arch: string;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  cpu: {
    cores: number;
    model: string;
    loadAverage: number[];
  };
  uptime: string;
}

export class HelloService {
  public getHelloMessage(framework: 'Express.js' | 'Raw Node.js'): string {
    return `Hello World from ${framework}`;
  }

  public getSystemDiagnostics(): SystemDiagnostics {
    const memory = process.memoryUsage();
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`,
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        loadAverage: os.loadavg(),
      },
      uptime: `${process.uptime().toFixed(1)}s`,
    };
  }
}
