import type { Product, ShirtColor, Side } from '../types';
import { Mockup } from './Mockup';

export function Artwork({ type }: { type: Product['artwork'] }) {
  if (type === 'orbit') return <div className="art art-orbit"><span /><i>TEELAB<br />ORBIT 24</i></div>;
  if (type === 'anatolia') return <div className="art art-anatolia"><span>◆</span><span>◇</span><span>◆</span></div>;
  if (type === 'signal') return <div className="art art-signal"><b>///</b><small>MOR<br />SİNYAL</small></div>;
  return <div className="art art-type">İYİ<br /><em>FİKİR</em></div>;
}

export function ShirtVisual({ color, side = 'front', artwork, designUrl, label }: { color: ShirtColor; side?: Side; artwork?: Product['artwork']; designUrl?: string; label?: string }) {
  return <Mockup color={color} side={side} designUrl={designUrl} designContent={artwork ? <Artwork type={artwork} /> : undefined} className="shirt-stage" label={label ?? 'Fotogerçekçi tişört önizlemesi'} />;
}
