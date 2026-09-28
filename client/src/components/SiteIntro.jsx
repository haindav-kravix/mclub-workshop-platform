import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { siMongodb } from 'simple-icons';
import './SiteIntro.css';

const INTRO_DURATION = 4000;
const SPLIT_AT = 2800;

const BrandLockup = ({ half }) => (
  <div className={`site-intro__brand site-intro__brand--${half}`}>
    <div className="site-intro__brand-content">
      <div className="site-intro__mark-wrap">
        <svg className="site-intro__mark" viewBox="0 0 24 24" role="img">
          <path fill={`#${siMongodb.hex}`} d={siMongodb.path} />
        </svg>
        <span className="site-intro__scan" />
      </div>
      <div className="site-intro__wording">
        <span className="site-intro__eyebrow">KLH University · Aziz Nagar</span>
        <span className="site-intro__mongodb">MongoDB</span>
        <span className="site-intro__club">Technical Club</span>
        <span className="site-intro__motto">Learn · Build · Innovate</span>
      </div>
    </div>
  </div>
);

export default function SiteIntro() {
  const mountRef = useRef(null);
  const [splitting, setSplitting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return undefined;
    const mount = mountRef.current;
    if (!mount) return undefined;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020807, 0.08);
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    const maxPixelRatio = window.innerWidth < 640 ? 1.15 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(22, 22, 0x00ed64, 0x0b3325);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -3.2;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    scene.add(grid);

    const count = window.innerWidth < 640 ? 110 : 280;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 17;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 7 - 1;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0x00ed64, size: 0.025, transparent: true, opacity: 0.62 });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const nodeCount = window.innerWidth < 640 ? 12 : 24;
    const nodePositions = [];
    const connectionPositions = [];
    for (let index = 0; index < nodeCount; index += 1) {
      const x = (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * 8;
      const z = -1.8 - Math.random() * 2.4;
      nodePositions.push(x, y, z);
      if (index > 0 && index % 2 === 0) {
        connectionPositions.push(
          nodePositions[(index - 1) * 3], nodePositions[(index - 1) * 3 + 1], nodePositions[(index - 1) * 3 + 2],
          x, y, z
        );
      }
    }
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
    const nodeMaterial = new THREE.PointsMaterial({ color: 0xb8ffce, size: 0.055, transparent: true, opacity: 0.9 });
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(nodes);

    const connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
    const connectionMaterial = new THREE.LineBasicMaterial({ color: 0x00ed64, transparent: true, opacity: 0.16 });
    const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
    scene.add(connections);

    const ringGeometry = new THREE.TorusGeometry(2.5, 0.012, 8, 160);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00ed64, transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.scale.y = 0.38;
    ring.rotation.x = 0.2;
    scene.add(ring);

    const clock = new THREE.Clock();
    let animationFrame;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      particles.rotation.y = elapsed * 0.035;
      particles.rotation.x = Math.sin(elapsed * 0.35) * 0.025;
      nodes.rotation.z = Math.sin(elapsed * 0.25) * 0.018;
      connections.rotation.z = nodes.rotation.z;
      nodeMaterial.opacity = 0.62 + Math.sin(elapsed * 2.4) * 0.2;
      ring.rotation.z = elapsed * 0.12;
      ring.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.035);
      ring.scale.y *= 0.38;
      camera.position.z = 8 - Math.min(elapsed, 3) * 0.16;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resize);

    const splitTimer = window.setTimeout(() => {
      cancelAnimationFrame(animationFrame);
      setSplitting(true);
    }, SPLIT_AT);
    const finishTimer = window.setTimeout(() => setVisible(false), INTRO_DURATION);

    return () => {
      window.clearTimeout(splitTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
      document.documentElement.style.overflow = previousOverflow;
      particleGeometry.dispose();
      particleMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      connectionGeometry.dispose();
      connectionMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`site-intro${splitting ? ' site-intro--splitting' : ''}`} aria-hidden="true">
      <div className="site-intro__curtain site-intro__curtain--top" />
      <div className="site-intro__curtain site-intro__curtain--bottom" />
      <div ref={mountRef} className="site-intro__scene" />
      <div className="site-intro__ambient site-intro__ambient--left" />
      <div className="site-intro__ambient site-intro__ambient--right" />
      <BrandLockup half="top" />
      <BrandLockup half="bottom" />
      <div className="site-intro__cut-line" />
    </div>
  );
}
