import { onMount, onCleanup } from "solid-js";

export default function HeroAnimation() {
  let canvasRef: HTMLCanvasElement | undefined;
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!canvasRef || !containerRef) return;
    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width: number;
    let height: number;
    let particles: Particle[] = [];
    
    // Adjust particle count based on screen size
    const getParticleCount = () => {
      const area = window.innerWidth * window.innerHeight;
      return Math.floor(area / 15000) + 30; // Adaptive density
    };

    let particleCount = getParticleCount();
    const connectionDistance = 160;
    const mouse = { x: -2000, y: -2000, radius: 150 };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.size = Math.random() * 2 + 1;
        this.color = "";
      }

      update(primaryColor: string) {
        this.color = primaryColor;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction: slight attraction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          this.x -= dx * force * 0.02;
          this.y -= dy * force * 0.02;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const resize = () => {
      if (!containerRef) return;
      width = canvas.width = containerRef.clientWidth;
      height = canvas.height = containerRef.clientHeight;
      particleCount = getParticleCount();
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const drawConnections = (primaryColor: string) => {
      if (!ctx) return;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            // Fade out based on distance
            const opacity = 1 - dist / connectionDistance;
            ctx.strokeStyle = primaryColor;
            ctx.globalAlpha = opacity * 0.4; // Subtle lines
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      const style = getComputedStyle(document.documentElement);
      const primaryColor = style.getPropertyValue('--primary').trim() || "#101828";
      
      particles.forEach((p) => {
        p.update(primaryColor);
        p.draw();
      });
      drawConnections(primaryColor);
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -2000;
      mouse.y = -2000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
      }
    };

    window.addEventListener("resize", resize);
    containerRef.addEventListener("mousemove", handleMouseMove);
    containerRef.addEventListener("mouseleave", handleMouseLeave);
    containerRef.addEventListener("touchmove", handleTouchMove);
    
    resize();
    animate();

    onCleanup(() => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (containerRef) {
        containerRef.removeEventListener("mousemove", handleMouseMove);
        containerRef.removeEventListener("mouseleave", handleMouseLeave);
        containerRef.removeEventListener("touchmove", handleTouchMove);
      }
    });
  });

  return (
    <div ref={containerRef} class="w-full h-full relative ">
      <canvas
        ref={canvasRef}
        class="w-full h-full block"
      />
    </div>
  );
}
