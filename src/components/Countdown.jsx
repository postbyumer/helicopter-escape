import React, { useEffect, useState } from 'react';
import { sound } from '../game/sound.js';

const STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 550;

export default function Countdown({ onComplete }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    sound.play('countdown');
    if (index >= STEPS.length) {
      onComplete();
      return;
    }
    if (STEPS[index] === 'GO!') sound.play('go');
    const t = setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (index >= STEPS.length) return null;

  return (
    <div className="overlay-dim" style={{ background: 'rgba(3,4,8,0.35)', backdropFilter: 'blur(2px)' }}>
      <div key={index} className="countdown-number">{STEPS[index]}</div>
    </div>
  );
}
