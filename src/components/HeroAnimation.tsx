import { onMount, onCleanup } from "solid-js";
import type { AnimationVariant } from "../types";

interface HeroAnimationProps {
  variant?: AnimationVariant;
}

export default function HeroAnimation(props: HeroAnimationProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!canvasRef || !containerRef) return;
    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    const mouse = { x: -2000, y: -2000, radius: 150 };

    const resize = () => {
      if (!containerRef) return;
      width = canvas.width = containerRef.clientWidth;
      height = canvas.height = containerRef.clientHeight;
    };

    const getPrimaryColor = (): string => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue("--primary").trim() || "#6366f1";
    };

    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        return {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        };
      }
      // Try rgb() format
      const rgbMatch = hex.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1]),
          g: parseInt(rgbMatch[2]),
          b: parseInt(rgbMatch[3]),
        };
      }
      return { r: 99, g: 102, b: 241 };
    };

    let variant = props.variant || "constellation";
    const variants: AnimationVariant[] = [
      "constellation",
      "data-stream",
      "topographical-matrix",
    ];
    if (variant === "random") {
      variant = variants[Math.floor(Math.random() * variants.length)];
    } else if (variant === "daily") {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;

      const dayOfYear = Math.floor(diff / oneDay);

      variant = variants[dayOfYear % variants.length];
    }
    // ─────────────────────────────────────────────
    // VARIANT 1: CONSTELLATION (Original)
    // ─────────────────────────────────────────────
    const runConstellation = () => {
      const connectionDistance = 160;

      class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;

        constructor() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.vx = (Math.random() - 0.5) * 0.6;
          this.vy = (Math.random() - 0.5) * 0.6;
          this.size = Math.random() * 2 + 1;
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;
          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;

          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= dx * force * 0.02;
            this.y -= dy * force * 0.02;
          }
        }
      }

      let particles: Particle[] = [];

      const init = () => {
        const count = Math.floor((width * height) / 15000) + 30;
        particles = Array.from({ length: count }, () => new Particle());
      };

      const animate = () => {
        ctx!.clearRect(0, 0, width, height);
        const color = getPrimaryColor();
        const rgb = hexToRgb(color);

        particles.forEach((p) => {
          p.update();
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.8)`;
          ctx!.fill();
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDistance) {
              const opacity = (1 - dist / connectionDistance) * 0.4;
              ctx!.beginPath();
              ctx!.moveTo(particles[i].x, particles[i].y);
              ctx!.lineTo(particles[j].x, particles[j].y);
              ctx!.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})`;
              ctx!.lineWidth = 0.8;
              ctx!.stroke();
            }
          }
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      init();
      animate();

      return init;
    };

    // VARIANT 3: DATA STREAM (Fluid Particle Flow)
    // ─────────────────────────────────────────────
    const runDataStream = () => {
      interface StreamParticle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        baseSpeed: number;
        life: number;
        maxLife: number;
        size: number;
        brightness: number;
      }

      let particles: StreamParticle[] = [];
      const flowAngle = -0.15; // Slight diagonal flow
      const baseFlowSpeed = 1.2;

      const createParticle = (): StreamParticle => {
        const edge = Math.random();
        let x: number, y: number;

        if (edge < 0.7) {
          // From left
          x = -10;
          y = Math.random() * height;
        } else if (edge < 0.85) {
          // From top
          x = Math.random() * width * 0.5;
          y = -10;
        } else {
          // From bottom
          x = Math.random() * width * 0.3;
          y = height + 10;
        }

        const speed = baseFlowSpeed + Math.random() * 0.8;
        return {
          x,
          y,
          vx: Math.cos(flowAngle) * speed,
          vy: Math.sin(flowAngle) * speed,
          baseSpeed: speed,
          life: 0,
          maxLife: width / speed + Math.random() * 200,
          size: Math.random() * 1.5 + 0.5,
          brightness: Math.random() * 0.5 + 0.3,
        };
      };

      const init = () => {
        const count = Math.floor((width * height) / 3000);
        particles = [];
        for (let i = 0; i < count; i++) {
          const p = createParticle();
          // Distribute existing particles across the canvas
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = Math.random() * p.maxLife;
          particles.push(p);
        }
      };

      const animate = () => {
        ctx!.fillStyle = "rgba(0,0,0,0)";
        ctx!.clearRect(0, 0, width, height);

        // Draw a subtle motion trail
        ctx!.fillStyle = document.documentElement.classList.contains("dark")
          ? "rgba(0,0,0,0.08)"
          : "rgba(255,255,255,0.08)";
        ctx!.fillRect(0, 0, width, height);

        const color = getPrimaryColor();
        const rgb = hexToRgb(color);
        const mouseActive = mouse.x > -1000;

        particles.forEach((p) => {
          // Base flow
          let targetVx = Math.cos(flowAngle) * p.baseSpeed;
          let targetVy = Math.sin(flowAngle) * p.baseSpeed;

          // Noise-like turbulence
          const noiseX = Math.sin(p.x * 0.005 + p.y * 0.003) * 0.3;
          const noiseY = Math.cos(p.y * 0.005 + p.x * 0.002) * 0.3;
          targetVx += noiseX;
          targetVy += noiseY;

          // Mouse gravity well
          if (mouseActive) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influenceRadius = 200;

            if (dist < influenceRadius && dist > 5) {
              const force = (influenceRadius - dist) / influenceRadius;
              // Orbit around mouse (tangential + slight attraction)
              const angle = Math.atan2(dy, dx);
              const tangentX = -Math.sin(angle) * force * 3;
              const tangentY = Math.cos(angle) * force * 3;
              const attractX = Math.cos(angle) * force * 0.5;
              const attractY = Math.sin(angle) * force * 0.5;

              targetVx += tangentX + attractX;
              targetVy += tangentY + attractY;

              // Increase brightness near mouse
              p.brightness = Math.min(1, p.brightness + force * 0.3);
            }
          }

          p.vx += (targetVx - p.vx) * 0.05;
          p.vy += (targetVy - p.vy) * 0.05;
          p.x += p.vx;
          p.y += p.vy;
          p.life++;

          // Fade brightness back
          p.brightness += (0.3 + Math.random() * 0.2 - p.brightness) * 0.01;

          // Speed-based brightness boost
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const speedBrightness = Math.min(1, speed / 4);

          const alpha = Math.min(p.brightness + speedBrightness * 0.3, 0.9);

          // Draw particle with a tiny tail
          const tailLength = Math.min(speed * 3, 12);
          const tailAngle = Math.atan2(-p.vy, -p.vx);

          ctx!.beginPath();
          ctx!.moveTo(
            p.x + Math.cos(tailAngle) * tailLength,
            p.y + Math.sin(tailAngle) * tailLength,
          );
          ctx!.lineTo(p.x, p.y);
          ctx!.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.5})`;
          ctx!.lineWidth = p.size * 0.8;
          ctx!.stroke();

          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
          ctx!.fill();

          // Reset if out of bounds
          if (
            p.x > width + 50 ||
            p.x < -50 ||
            p.y > height + 50 ||
            p.y < -50 ||
            p.life > p.maxLife
          ) {
            const np = createParticle();
            Object.assign(p, np);
          }
        });

        // Mouse glow effect
        if (mouseActive) {
          const gradient = ctx!.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            120,
          );
          gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.06)`);
          gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
          ctx!.beginPath();
          ctx!.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
          ctx!.fillStyle = gradient;
          ctx!.fill();
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      init();
      animate();
      return init;
    };

    // ─────────────────────────────────────────────
    // VARIANT 6: TOPOGRAPHICAL MATRIX
    // ─────────────────────────────────────────────
    const runTopographicalMatrix = () => {
      interface GridPoint {
        baseX: number;
        baseY: number;
        elevation: number;
        targetElevation: number;
      }

      let grid: GridPoint[][] = [];
      let cols = 0;
      let rows = 0;
      const spacing = 30;

      const init = () => {
        grid = [];
        cols = Math.ceil(width / spacing) + 2;
        rows = Math.ceil(height / spacing) + 2;

        for (let r = 0; r < rows; r++) {
          const row: GridPoint[] = [];
          for (let c = 0; c < cols; c++) {
            row.push({
              baseX: c * spacing - spacing,
              baseY: r * spacing - spacing,
              elevation: 0,
              targetElevation: 0,
            });
          }
          grid.push(row);
        }
      };

      const animate = (time: number) => {
        ctx!.clearRect(0, 0, width, height);
        const color = getPrimaryColor();
        const rgb = hexToRgb(color);
        const mouseActive = mouse.x > -1000;
        const influenceRadius = 200;

        // Update elevations
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const point = grid[r][c];

            // Ambient wave
            const wave =
              Math.sin(point.baseX * 0.015 + time * 0.0008) *
              Math.cos(point.baseY * 0.012 + time * 0.0006) *
              8;

            let mouseElevation = 0;
            if (mouseActive) {
              const dx = mouse.x - point.baseX;
              const dy = mouse.y - point.baseY;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < influenceRadius) {
                const normalized = dist / influenceRadius;
                // Smooth bell curve elevation
                mouseElevation = Math.exp(-normalized * normalized * 3) * 50;
                // Ripple rings
                mouseElevation +=
                  Math.sin(dist * 0.08 - time * 0.004) * (1 - normalized) * 8;
              }
            }

            point.targetElevation = wave + mouseElevation;
            point.elevation += (point.targetElevation - point.elevation) * 0.12;
          }
        }

        // Draw grid — isometric projection
        const isoAngle = 0.6; // Tilt angle
        const cosA = Math.cos(isoAngle);

        // Helper to project point with elevation
        const project = (
          x: number,
          y: number,
          elev: number,
        ): [number, number] => {
          return [x, y * cosA - elev];
        };

        // Draw horizontal lines
        for (let r = 0; r < rows; r++) {
          ctx!.beginPath();
          for (let c = 0; c < cols; c++) {
            const p = grid[r][c];
            const [px, py] = project(p.baseX, p.baseY, p.elevation);

            if (c === 0) {
              ctx!.moveTo(px, py);
            } else {
              ctx!.lineTo(px, py);
            }
          }

          // Color based on row depth
          const depthOpacity = 0.08 + (r / rows) * 0.15;
          ctx!.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${depthOpacity})`;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();
        }

        // Draw vertical lines
        for (let c = 0; c < cols; c++) {
          ctx!.beginPath();
          for (let r = 0; r < rows; r++) {
            const p = grid[r][c];
            const [px, py] = project(p.baseX, p.baseY, p.elevation);

            if (r === 0) {
              ctx!.moveTo(px, py);
            } else {
              ctx!.lineTo(px, py);
            }
          }

          const depthOpacity = 0.06 + (c / cols) * 0.1;
          ctx!.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${depthOpacity})`;
          ctx!.lineWidth = 0.6;
          ctx!.stroke();
        }

        // Highlight elevated intersection points
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const p = grid[r][c];
            if (Math.abs(p.elevation) > 5) {
              const [px, py] = project(p.baseX, p.baseY, p.elevation);
              const intensity = Math.min(1, Math.abs(p.elevation) / 30);

              ctx!.beginPath();
              ctx!.arc(px, py, 1.5 + intensity * 2, 0, Math.PI * 2);
              ctx!.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${intensity * 0.6})`;
              ctx!.fill();
            }
          }
        }

        // Contour lines (elevation rings when mouse active)
        if (mouseActive) {
          const contourLevels = [10, 20, 30, 40];
          contourLevels.forEach((level) => {
            const contourRadius = influenceRadius * (1 - level / 60) * 0.8;
            if (contourRadius > 0) {
              const [mx, my] = project(mouse.x, mouse.y, level * 0.8);
              ctx!.beginPath();
              ctx!.ellipse(
                mx,
                my,
                contourRadius,
                contourRadius * cosA,
                0,
                0,
                Math.PI * 2,
              );
              ctx!.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.1)`;
              ctx!.lineWidth = 0.5;
              ctx!.setLineDash([3, 6]);
              ctx!.stroke();
              ctx!.setLineDash([]);
            }
          });

          // Elevation label
          const maxElev = grid
            .flat()
            .reduce((max, p) => Math.max(max, p.elevation), 0);
          if (maxElev > 5) {
            ctx!.font = `${Math.max(9, width * 0.007)}px ui-monospace, monospace`;
            ctx!.textAlign = "center";
            ctx!.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`;
            ctx!.fillText(
              `z: ${maxElev.toFixed(1)}`,
              mouse.x,
              mouse.y * cosA - maxElev - 20,
            );
          }
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      init();
      animationFrameId = requestAnimationFrame(animate);
      return init;
    };

    // ─────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────
    resize();

    let reinit: (() => void) | undefined;

    switch (variant) {
      case "data-stream":
        reinit = runDataStream();
        break;
      case "topographical-matrix":
        reinit = runTopographicalMatrix();
        break;
      case "constellation":
      default:
        reinit = runConstellation();
        break;
    }

    const handleResize = () => {
      resize();
      if (reinit) reinit();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef) return;
      const rect = canvasRef.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.x = x;
        mouse.y = y;
      } else {
        mouse.x = -2000;
        mouse.y = -2000;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = -2000;
      mouse.y = -2000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0 && canvasRef) {
        const rect = canvasRef.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          mouse.x = x;
          mouse.y = y;
        } else {
          mouse.x = -2000;
          mouse.y = -2000;
        }
      }
    };

    const handleTouchEnd = () => {
      mouse.x = -2000;
      mouse.y = -2000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    window.addEventListener("touchend", handleTouchEnd);

    onCleanup(() => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    });
  });

  return (
    <div ref={containerRef} class="w-full h-full relative pointer-events-none">
      <canvas ref={canvasRef} class="w-full h-full block" />
    </div>
  );
}
