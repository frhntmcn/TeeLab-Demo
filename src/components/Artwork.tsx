import type { Product, ShirtColor, Side } from '../types';
import { Mockup } from './Mockup';

export function Artwork({ type }: { type: Product['artwork'] }) {
  if (type === 'orbit') return (
    <svg className="art art-vector" viewBox="0 0 300 400" role="img" aria-label="Gece Yörüngesi baskısı">
      <rect width="300" height="400" fill="#111827" />
      <circle cx="150" cy="170" r="84" fill="none" stroke="#a78bfa" strokeWidth="4" />
      <ellipse cx="150" cy="170" rx="118" ry="36" fill="none" stroke="#f8fafc" strokeWidth="7" transform="rotate(-22 150 170)" />
      <circle cx="228" cy="103" r="11" fill="#7c3aed" />
      <text x="150" y="302" textAnchor="middle" fill="#f8fafc" fontFamily="Arial" fontWeight="800" fontSize="27" letterSpacing="7">ORBIT</text>
      <text x="150" y="328" textAnchor="middle" fill="#a78bfa" fontFamily="Arial" fontSize="10" letterSpacing="4">TEELAB / 2026</text>
    </svg>
  );
  if (type === 'anatolia') return (
    <svg className="art art-vector" viewBox="0 0 300 400" role="img" aria-label="Anadolu Form baskısı">
      <rect width="300" height="400" fill="#f4ead8" />
      <g transform="translate(150 184)" fill="none" stroke="#9a3412" strokeWidth="7">
        <path d="M0-110 54-54 110 0 54 54 0 110-54 54-110 0-54-54Z" />
        <path d="M0-75 38-38 75 0 38 38 0 75-38 38-75 0-38-38Z" />
        <path d="M0-38 38 0 0 38-38 0Z" fill="#7c2d12" />
      </g>
      <text x="150" y="340" textAnchor="middle" fill="#7c2d12" fontFamily="Georgia" fontSize="15" letterSpacing="5">ANADOLU FORM</text>
    </svg>
  );
  if (type === 'signal') return (
    <svg className="art art-vector" viewBox="0 0 300 400" role="img" aria-label="Mor Sinyal baskısı">
      <rect width="300" height="400" fill="#f8fafc" />
      <g fill="none" stroke="#7c3aed" strokeWidth="12" strokeLinecap="round"><path d="M35 128h52l18-58 42 174 30-112 22 66h66" /><path d="M35 278h230" strokeWidth="4" /></g>
      <text x="38" y="322" fill="#0f172a" fontFamily="Arial" fontWeight="900" fontSize="35">MOR</text>
      <text x="38" y="355" fill="#7c3aed" fontFamily="Arial" fontWeight="900" fontSize="35">SİNYAL</text>
    </svg>
  );
  return (
    <svg className="art art-vector" viewBox="0 0 300 400" role="img" aria-label="İyi Fikir baskısı">
      <rect width="300" height="400" fill="#f8fafc" />
      <text x="150" y="145" textAnchor="middle" fill="#0f172a" fontFamily="Arial" fontWeight="900" fontSize="72">İYİ</text>
      <rect x="35" y="175" width="230" height="92" rx="46" fill="#7c3aed" />
      <text x="150" y="239" textAnchor="middle" fill="white" fontFamily="Georgia" fontStyle="italic" fontWeight="700" fontSize="52">FİKİR</text>
      <text x="150" y="310" textAnchor="middle" fill="#475569" fontFamily="Arial" fontSize="10" letterSpacing="4">WEAR THE THOUGHT</text>
    </svg>
  );
}

export function ShirtVisual({ color, side = 'front', artwork, designUrl, label }: { color: ShirtColor; side?: Side; artwork?: Product['artwork']; designUrl?: string; label?: string }) {
  return <Mockup color={color} side={side} designUrl={designUrl} designContent={artwork ? <Artwork type={artwork} /> : undefined} className="shirt-stage" label={label ?? 'Fotogerçekçi tişört önizlemesi'} />;
}
