'use client';

import React, { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { X, Check, RefreshCw } from 'lucide-react';

/* ── "BORED APE" / PREMIUM NFT TRAIT ENGINE v2 ── */
// Canvas is 200x200

// Expanded Backgrounds
const BG_COLORS = ['#E4E4A8', '#A2E5F4', '#F4A2A2', '#A2F4A2', '#CBA2F4', '#FFAC33', '#121210', '#E5E5E5', 'url(#acid-trip)', 'url(#gold-rush)'];

// Expanded Furs
const FURS = [
  { name: 'Brown', main: '#87563B', snout: '#E8B48F' },
  { name: 'Dark Brown', main: '#503322', snout: '#C68767' },
  { name: 'Gold', main: '#FFD166', snout: '#FFF4D6' },
  { name: 'Zombie', main: '#768E65', snout: '#57674B' },
  { name: 'Robot', main: '#AAB8C3', snout: '#8A9BA8' },
  { name: 'Pink', main: '#EF476F', snout: '#FFD1D9' },
  { name: 'Diamond', main: 'url(#diamond-fur)', snout: '#E2F1F8' },
  { name: 'Cheetah', main: 'url(#cheetah-fur)', snout: '#FFE7B4' },
];

const OUTFITS = [
  // Floating Head
  () => null,
  // Black T-Shirt
  () => <path d="M 40 160 Q 100 135 160 160 L 200 240 L 0 240 Z" fill="#121210" stroke="#121210" strokeWidth="6" />,
  // Hawaiian Shirt
  () => <><path d="M 30 160 C 50 140, 150 140, 170 160 L 200 240 L 0 240 Z" fill="#EF476F" stroke="#121210" strokeWidth="6"/><circle cx="50" cy="190" r="10" fill="#FFD166"/><circle cx="150" cy="210" r="12" fill="#FFD166"/><circle cx="90" cy="220" r="8" fill="#FFD166"/><path d="M 80 160 L 100 230 L 120 160 Z" fill="#fff" stroke="#121210" strokeWidth="4"/></>,
  // Tuxedo
  () => <><path d="M 30 160 L 100 135 L 170 160 L 200 240 L 0 240 Z" fill="#121210" stroke="#121210" strokeWidth="6"/><path d="M 70 160 L 100 135 L 130 160 Z" fill="#fff" stroke="#121210" strokeWidth="5"/><path d="M 90 180 Q 100 200 110 180 L 100 170 Z" fill="#EF476F" stroke="#121210" strokeWidth="4" /> <circle cx="85" cy="175" r="5" fill="#EF476F" /><circle cx="115" cy="175" r="5" fill="#EF476F" /></>,
  // Bayc Sailor Shirt
  () => <><path d="M 40 160 L 160 160 L 190 240 L 10 240 Z" fill="#fff" stroke="#121210" strokeWidth="6"/><line x1="10" y1="180" x2="190" y2="180" stroke="#118AB2" strokeWidth="6"/><line x1="0" y1="210" x2="200" y2="210" stroke="#118AB2" strokeWidth="6"/></>,
  // Gold Chain & Fur Coat (Pimp)
  (fur: string, snout: string) => <><path d="M 20 170 Q 100 120 180 170 L 200 240 L 0 240 Z" fill="#A4243B" stroke="#121210" strokeWidth="6"/><path d="M 60 160 C 80 230, 120 230, 140 160 L 100 240 Z" fill={fur} stroke="#121210" strokeWidth="4" /><path d="M 70 160 L 100 210 L 130 160" fill="none" stroke="#FFD166" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" /><circle cx="100" cy="215" r="12" fill="#FFD166" stroke="#121210" strokeWidth="4"/></>,
  // Cyberpunk Puffer Jacket
  () => <><path d="M 10 170 Q 100 120 190 170 L 200 240 L 0 240 Z" fill="#06D6A0" stroke="#121210" strokeWidth="8" strokeLinejoin="round"/><path d="M 70 160 L 130 160 L 130 240 L 70 240 Z" fill="#121210"/><line x1="30" y1="190" x2="70" y2="190" stroke="#121210" strokeWidth="8"/><line x1="170" y1="190" x2="130" y2="190" stroke="#121210" strokeWidth="8"/></>,
  // Roman Toga
  (fur: string) => <><path d="M 20 170 Q 100 130 180 170 L 200 240 L 0 240 Z" fill={fur} stroke="#121210" strokeWidth="6"/><path d="M 90 150 L 200 180 L 200 240 L 0 240 Z" fill="#fff" stroke="#121210" strokeWidth="6"/><path d="M 90 150 L 80 240" fill="none" stroke="#121210" strokeWidth="6"/></>,
  // NASA Spacesuit
  () => <><path d="M 20 170 Q 100 120 180 170 L 200 240 L 0 240 Z" fill="#fff" stroke="#121210" strokeWidth="8"/><circle cx="140" cy="200" r="16" fill="#118AB2" stroke="#121210" strokeWidth="4"/><line x1="40" y1="190" x2="80" y2="190" stroke="#EF476F" strokeWidth="6"/><line x1="40" y1="210" x2="80" y2="210" stroke="#06D6A0" strokeWidth="6"/></>
];

const HEADS = [
  // Classic Ape Head
  (fur: string, snout: string) => <>
    <circle cx="45" cy="105" r="18" fill={fur} stroke="#121210" strokeWidth="6"/>
    <path d="M 45 100 C 35 100, 35 110, 45 115" stroke="#121210" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="155" cy="105" r="18" fill={fur} stroke="#121210" strokeWidth="6"/>
    <path d="M 155 100 C 165 100, 165 110, 155 115" stroke="#121210" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M 55 60 C 55 10, 145 10, 145 60 L 145 120 C 145 160, 55 160, 55 120 Z" fill={fur} stroke="#121210" strokeWidth="6"/>
    <path d="M 65 115 C 65 95, 135 95, 135 115 L 140 145 C 140 185, 60 185, 60 145 Z" fill={snout} stroke="#121210" strokeWidth="6"/>
    <ellipse cx="90" cy="118" rx="4" ry="7" fill="#121210" transform="rotate(-15, 90, 118)" />
    <ellipse cx="110" cy="118" rx="4" ry="7" fill="#121210" transform="rotate(15, 110, 118)" />
  </>
];

const EYES = [
  // Bored (Half closed)
  (fur: string) => <><circle cx="80" cy="90" r="12" fill="#fff" stroke="#121210" strokeWidth="5"/><circle cx="80" cy="92" r="4" fill="#121210"/><path d="M 65 85 Q 80 80 95 85 Z" fill={fur} stroke="#121210" strokeWidth="4" /><circle cx="120" cy="90" r="12" fill="#fff" stroke="#121210" strokeWidth="5"/><circle cx="120" cy="92" r="4" fill="#121210"/><path d="M 105 85 Q 120 80 135 85 Z" fill={fur} stroke="#121210" strokeWidth="4" /></>,
  // Bloodshot Bored
  (fur: string) => <><circle cx="80" cy="90" r="12" fill="#FFE0E0" stroke="#121210" strokeWidth="5"/><circle cx="120" cy="90" r="12" fill="#FFE0E0" stroke="#121210" strokeWidth="5"/><path d="M 80 80 L 80 85 M 70 85 L 75 90" stroke="#EF476F" strokeWidth="2" strokeLinecap="round" /><path d="M 120 80 L 120 85 M 130 85 L 125 90" stroke="#EF476F" strokeWidth="2" strokeLinecap="round" /><circle cx="80" cy="92" r="3" fill="#121210"/><circle cx="120" cy="92" r="3" fill="#121210"/><path d="M 65 85 L 135 85" stroke="#121210" strokeWidth="5" strokeLinecap="round" /></>,
  // Laser Eyes
  () => <><circle cx="80" cy="90" r="10" fill="#EF476F"/><circle cx="120" cy="90" r="10" fill="#EF476F"/><path d="M 80 90 L -120 120" stroke="#EF476F" strokeWidth="18" opacity="0.8"/><path d="M 80 90 L -120 120" stroke="#fff" strokeWidth="6"/><path d="M 120 90 L 320 120" stroke="#EF476F" strokeWidth="18" opacity="0.8"/><path d="M 120 90 L 320 120" stroke="#fff" strokeWidth="6"/></>,
  // 3D Glasses
  () => <><path d="M 60 85 L 140 85" stroke="#121210" strokeWidth="14" strokeLinecap="round"/><path d="M 155 80 L 45 80 L 55 105 L 145 105 Z" fill="#121210" stroke="#121210" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /><rect x="58" y="80" width="37" height="22" fill="#118AB2" /><rect x="105" y="80" width="37" height="22" fill="#EF476F" /></>,
  // Cyberpunk VR Visor
  () => <><rect x="45" y="70" width="110" height="40" rx="10" fill="#121210" stroke="#121210" strokeWidth="6"/><rect x="50" y="85" width="100" height="15" rx="5" fill="#06D6A0" /><line x1="155" y1="90" x2="200" y2="90" stroke="#121210" strokeWidth="14" /><line x1="45" y1="90" x2="0" y2="90" stroke="#121210" strokeWidth="14" /></>,
  // Heart Glasses
  () => <><path d="M 85 75 A 12 12 0 0 0 65 75 A 12 12 0 0 0 45 75 L 45 85 L 65 105 L 85 85 Z" fill="#EF476F" stroke="#121210" strokeWidth="6" strokeLinejoin="round"/><path d="M 155 75 A 12 12 0 0 0 135 75 A 12 12 0 0 0 115 75 L 115 85 L 135 105 L 155 85 Z" fill="#EF476F" stroke="#121210" strokeWidth="6" strokeLinejoin="round"/><line x1="85" y1="85" x2="115" y2="85" stroke="#121210" strokeWidth="6"/></>,
  // Eyepatch (Pirate/Nick Fury style)
  (fur: string) => <><circle cx="80" cy="90" r="12" fill="#fff" stroke="#121210" strokeWidth="5"/><circle cx="80" cy="92" r="4" fill="#121210"/><path d="M 65 85 Q 80 80 95 85 Z" fill={fur} stroke="#121210" strokeWidth="4" /><path d="M 45 75 L 140 100" stroke="#121210" strokeWidth="6" strokeLinecap="round"/><circle cx="120" cy="90" r="16" fill="#121210"/></>,
  // Solarpunk Goggles
  () => <><path d="M 50 85 L 150 85" stroke="#121210" strokeWidth="8" strokeLinecap="round" /><circle cx="80" cy="90" r="18" fill="#FFD166" stroke="#121210" strokeWidth="6"/><circle cx="120" cy="90" r="18" fill="#FFD166" stroke="#121210" strokeWidth="6"/><circle cx="80" cy="90" r="6" fill="#fff" opacity="0.6"/><circle cx="120" cy="90" r="6" fill="#fff" opacity="0.6"/></>,
  // Crazy Wide Eyes
  () => <><circle cx="78" cy="85" r="16" fill="#fff" stroke="#121210" strokeWidth="4"/><circle cx="122" cy="85" r="16" fill="#fff" stroke="#121210" strokeWidth="4"/><circle cx="75" cy="82" r="3" fill="#121210"/><circle cx="125" cy="82" r="3" fill="#121210"/></>
];

const MOUTHS = [
  // Bored Straight Line
  () => <path d="M 75 145 L 125 145" stroke="#121210" strokeWidth="6" strokeLinecap="round" />,
  // Cigar / Smoking Pipe
  () => <><path d="M 75 145 C 90 145, 110 148, 125 143" stroke="#121210" strokeWidth="6" strokeLinecap="round" /><path d="M 115 145 L 140 160" stroke="#121210" strokeWidth="18" strokeLinecap="round"/><path d="M 115 145 L 140 160" stroke="#87563B" strokeWidth="14" strokeLinecap="round"/><circle cx="140" cy="160" r="7" fill="#EF476F" stroke="#121210" strokeWidth="2" /><circle cx="155" cy="140" r="10" fill="#fff" opacity="0.6"/><circle cx="165" cy="120" r="14" fill="#fff" opacity="0.4"/></>,
  // Bayc Grin with Teeth
  () => <><path d="M 75 145 C 90 155, 110 155, 125 145" fill="#121210" /><path d="M 80 145 L 120 145 L 115 152 L 85 152 Z" fill="#fff" stroke="#121210" strokeWidth="4" /><path d="M 72 145 C 90 155, 110 155, 128 145" stroke="#121210" strokeWidth="5" fill="none" strokeLinecap="round" /></>,
  // Dumbfounded O Mouth
  () => <ellipse cx="100" cy="150" rx="12" ry="18" fill="#121210" stroke="#87563B" strokeWidth="3" />,
  // Bubblegum
  () => <><path d="M 85 145 L 105 145" stroke="#121210" strokeWidth="6" strokeLinecap="round" /><circle cx="115" cy="135" r="30" fill="#F7B6DA" stroke="#121210" strokeWidth="5" opacity="0.95" /><path d="M 125 115 A 15 15 0 0 0 135 125" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" /></>,
  // Gold Grill Smile
  () => <><path d="M 75 145 C 90 155, 110 155, 125 145 Z" fill="#FFD166" stroke="#121210" strokeWidth="5" strokeLinejoin="round" /><line x1="90" y1="147" x2="90" y2="152" stroke="#121210" strokeWidth="3"/><line x1="100" y1="148" x2="100" y2="153" stroke="#121210" strokeWidth="3"/><line x1="110" y1="147" x2="110" y2="152" stroke="#121210" strokeWidth="3"/></>,
  // Pizza Slice in Mouth
  () => <><path d="M 75 145 L 125 145" stroke="#121210" strokeWidth="6" strokeLinecap="round" /><path d="M 100 145 L 75 190 L 125 190 Z" fill="#F4D03F" stroke="#121210" strokeWidth="4" strokeLinejoin="round"/><path d="M 100 145 L 75 155 L 125 155 Z" fill="#E67E22" /><circle cx="95" cy="170" r="5" fill="#E74C3C"/><circle cx="110" cy="180" r="5" fill="#E74C3C"/></>,
  // Stitched Lips / Cyber Zombie
  () => <><path d="M 75 145 L 125 145" stroke="#121210" strokeWidth="5" strokeLinecap="round" /><line x1="85" y1="138" x2="85" y2="152" stroke="#121210" strokeWidth="4"/><line x1="100" y1="138" x2="100" y2="152" stroke="#121210" strokeWidth="4"/><line x1="115" y1="138" x2="115" y2="152" stroke="#121210" strokeWidth="4"/></>
];

const HEADWEAR = [
  // None
  () => null,
  // Sailor Captain Hat
  () => <><path d="M 50 40 L 150 40 L 140 10 L 60 10 Z" fill="#fff" stroke="#121210" strokeWidth="6" /><path d="M 40 45 C 70 30, 130 30, 160 45 Z" fill="#121210" /><circle cx="100" cy="25" r="8" fill="#FFD166" /></>,
  // Classic Beanie
  () => <><path d="M 50 50 C 50 -10, 150 -10, 150 50 Z" fill="#FF6B6B" stroke="#121210" strokeWidth="6" /><polyline points="45,55 155,55" stroke="#121210" strokeWidth="12" strokeLinecap="round" /></>,
  // Spinner / Propeller Hat
  () => <><path d="M 60 50 C 60 10, 140 10, 140 50 Z" fill="#4D96FF" stroke="#121210" strokeWidth="6" /><path d="M 50 50 C 80 40, 120 40, 150 50 Z" fill="#FFD166" stroke="#121210" strokeWidth="6" /><line x1="100" y1="15" x2="100" y2="-5" stroke="#121210" strokeWidth="6" /><ellipse cx="100" cy="-5" rx="30" ry="5" fill="#EF476F" stroke="#121210" strokeWidth="4" /></>,
  // Angel Halo
  () => <><ellipse cx="100" cy="15" rx="45" ry="12" fill="none" stroke="#FFD166" strokeWidth="10" /><line x1="100" y1="27" x2="100" y2="40" stroke="#FFD166" strokeWidth="6" opacity="0.4" /></>,
  // Golden Crown
  () => <path d="M 60 50 L 50 -5 L 75 20 L 100 -10 L 125 20 L 150 -5 L 140 50 Z" fill="#FFD166" stroke="#121210" strokeWidth="6" strokeLinejoin="round" />,
  // Police / Guard Hat
  () => <><path d="M 55 45 C 70 15, 130 15, 145 45 Z" fill="#118AB2" stroke="#121210" strokeWidth="6"/><path d="M 45 45 C 70 35, 130 35, 155 45 Z" fill="#121210" stroke="#121210" strokeWidth="6"/><polygon points="95,25 105,25 100,35" fill="#FFD166"/></>,
  // Cowboy Hat
  () => <><path d="M 70 45 C 70 10, 130 10, 130 45 Z" fill="#87563B" stroke="#121210" strokeWidth="6"/><ellipse cx="100" cy="45" rx="70" ry="15" fill="#87563B" stroke="#121210" strokeWidth="6"/></>,
  // Samurai Helmet (Kabuto horns)
  () => <><path d="M 50 55 C 50 10, 150 10, 150 55 Z" fill="#121210" stroke="#121210" strokeWidth="6"/><path d="M 40 55 C 70 -20, 130 -20, 160 55 Z" fill="none" stroke="#FFD166" strokeWidth="8" strokeLinecap="round"/><circle cx="100" cy="30" r="10" fill="#EF476F"/></>
];

interface AvatarCreatorProps {
  onClose: () => void;
}

export function AvatarCreator({ onClose }: AvatarCreatorProps) {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const [bgIdx, setBgIdx] = useState(Math.floor(Math.random() * BG_COLORS.length));
  const [furIdx, setFurIdx] = useState(Math.floor(Math.random() * FURS.length));
  const [bodyIdx, setBodyIdx] = useState(Math.floor(Math.random() * OUTFITS.length));
  const [eyeIdx, setEyeIdx] = useState(Math.floor(Math.random() * EYES.length));
  const [mouthIdx, setMouthIdx] = useState(Math.floor(Math.random() * MOUTHS.length));
  const [hatIdx, setHatIdx] = useState(Math.floor(Math.random() * HEADWEAR.length));

  const randomize = () => {
    setBgIdx(Math.floor(Math.random() * BG_COLORS.length));
    setFurIdx(Math.floor(Math.random() * FURS.length));
    setBodyIdx(Math.floor(Math.random() * OUTFITS.length));
    setEyeIdx(Math.floor(Math.random() * EYES.length));
    setMouthIdx(Math.floor(Math.random() * MOUTHS.length));
    setHatIdx(Math.floor(Math.random() * HEADWEAR.length));
  };

  const currentFur = FURS[furIdx];

  const handleSave = async () => {
    if (!svgRef.current || !user) return;
    setIsSaving(true);
    try {
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const svgWithSizes = svgData.replace('<svg ', '<svg width="512" height="512" ');
      
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      const img = new Image();
      const svgBlob = new Blob([svgWithSizes], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.onerror = reject;
        img.src = url;
      });

      const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!pngBlob) throw new Error('Failed to create PNG blob');

      const file = new File([pngBlob], 'avatar.png', { type: 'image/png' });
      await user.setProfileImage({ file });
      onClose();
    } catch (e) {
      console.error(e);
      alert('Minting failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const shift = (val: number, setVal: (v: number) => void, max: number, dir: 1 | -1) => {
    setVal((val + dir + max) % max);
  };

  const ControlRow = ({ label, val, setVal, max, valueName }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FEFBEF', borderRadius: 12, border: '1.5px solid #D8CFBE', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#121210' }}>{label}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => shift(val, setVal, max, -1)} style={{ background: '#F9F3E4', border: '1.5px solid #121210', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800, color: '#121210', boxShadow: '0 2px 0 #121210' }} onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 0px 0 #121210'; }} onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 0 #121210'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 0 #121210'; }}>{'<'}</button>
        <div style={{ fontSize: 12, fontWeight: 700, width: 70, textAlign: 'center', color: '#8B867C', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{valueName || `${val + 1}/${max}`}</div>
        <button onClick={() => shift(val, setVal, max, 1)} style={{ background: '#121210', border: '1.5px solid #121210', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800, color: '#fff', boxShadow: '0 2px 0 #8B867C' }} onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 0px 0 #8B867C'; }} onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 0 #8B867C'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 0 #8B867C'; }}>{'>'}</button>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(18,18,16,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: '#F9F3E4', border: '3px solid #121210', borderRadius: 24, padding: '32px 32px 24px',
        width: 440, maxWidth: '90vw', maxHeight: '95vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position:'absolute', top:24, right:24, background:'transparent', border:'none', cursor:'pointer', color:'#8B867C', transition: 'color 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.color = '#121210'}
          onMouseOut={(e) => e.currentTarget.style.color = '#8B867C'}
        ><X size={24} strokeWidth={3}/></button>
        
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#121210', letterSpacing: '-0.5px' }}>Bored Ape Generator</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#8B867C', fontWeight: 500 }}>Unlock thousands of trait combinations.</p>
        </div>

        {/* ── Avatar Preview ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30, position: 'relative' }}>
          <div style={{ width: 180, height: 180, borderRadius: 24, overflow: 'hidden', border: '4px solid #121210', boxShadow: '0 12px 0 rgba(18,18,16,0.1)' }}>
            <svg ref={svgRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', background: BG_COLORS[bgIdx], display: 'block' }}>
              <defs>
                 <linearGradient id="acid-trip" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#EF476F" />
                   <stop offset="50%" stopColor="#FFD166" />
                   <stop offset="100%" stopColor="#06D6A0" />
                 </linearGradient>
                 <radialGradient id="gold-rush" cx="50%" cy="50%" r="50%">
                   <stop offset="0%" stopColor="#FFF4D6" />
                   <stop offset="100%" stopColor="#FFD166" />
                 </radialGradient>
                 <linearGradient id="diamond-fur" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#E2F1F8" />
                   <stop offset="100%" stopColor="#B0BEC5" />
                 </linearGradient>
                 <pattern id="cheetah-fur" width="20" height="20" patternUnits="userSpaceOnUse">
                   <rect width="20" height="20" fill="#F39C12" />
                   <circle cx="5" cy="5" r="3" fill="#121210" />
                   <circle cx="15" cy="15" r="4" fill="#121210" />
                 </pattern>
              </defs>
              {OUTFITS[bodyIdx]!(currentFur.main, currentFur.snout)}
              {HEADS[0]!(currentFur.main, currentFur.snout)}
              {EYES[eyeIdx]!(currentFur.main)}
              {MOUTHS[mouthIdx]!()}
              {HEADWEAR[hatIdx]!()}
            </svg>
          </div>
          
          <button 
            onClick={randomize}
            title="Roll Traits"
            style={{
              position: 'absolute', bottom: -15, right: 100, background: '#EF476F', color: '#121210', border: '3px solid #121210',
              borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 0 #121210', transition: 'all 0.1s'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0px 0 #121210'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #121210'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #121210'; }}
          >
            <RefreshCw size={20} strokeWidth={3} />
          </button>
        </div>

        {/* ── Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 260, overflowY: 'auto', paddingRight: 6, marginBottom: 24 }}>
          <ControlRow label="Background Base" val={bgIdx} setVal={setBgIdx} max={BG_COLORS.length} />
          <ControlRow label="Ape Fur" val={furIdx} setVal={setFurIdx} max={FURS.length} valueName={FURS[furIdx]!.name} />
          <ControlRow label="Outfit / Clothes" val={bodyIdx} setVal={setBodyIdx} max={OUTFITS.length} />
          <ControlRow label="Eyes / Glasses" val={eyeIdx} setVal={setEyeIdx} max={EYES.length} />
          <ControlRow label="Mouth / Snout" val={mouthIdx} setVal={setMouthIdx} max={MOUTHS.length} />
          <ControlRow label="Headwear" val={hatIdx} setVal={setHatIdx} max={HEADWEAR.length} />
        </div>

        {/* ── Save Button ── */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%', background: '#A8D8B9', color: '#121210', border: '3px solid #121210', borderRadius: 16,
            padding: '16px 0', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 6px 0 #121210', transition: 'all 0.1s'
          }}
          onMouseDown={(e) => { if(!isSaving) { e.currentTarget.style.transform = 'translateY(6px)'; e.currentTarget.style.boxShadow = '0 0px 0 #121210'; } }}
          onMouseUp={(e) => { if(!isSaving) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 0 #121210'; } }}
          onMouseLeave={(e) => { if(!isSaving) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 0 #121210'; } }}
        >
          {isSaving ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={20} strokeWidth={3} />}
          {isSaving ? 'Minting Ape...' : 'Set as Profile Picture'}
        </button>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D8CFBE; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #8B867C; }
      `}</style>
    </div>
  );
}
