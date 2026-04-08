import { useEffect, useRef } from 'react';

export default function PinInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].setAttribute('inputmode', 'numeric');
    }
  }, []);

  const focusInput = (index) => {
    const input = inputRefs.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleChange = (event, index) => {
    const rawValue = event.target.value.replace(/\D/g, '');
    if (!rawValue) {
      const newValue = value.split('').map((digit, position) => (position === index ? '' : digit)).join('').slice(0, 4);
      onChange(newValue);
      return;
    }

    const digits = rawValue.split('');
    const currentDigits = value.split('').slice(0, 4);

    for (let i = currentDigits.length; i < 4; i += 1) {
      currentDigits.push('');
    }

    let nextIndex = index;
    digits.forEach((digit) => {
      if (nextIndex < 4) {
        currentDigits[nextIndex] = digit;
        nextIndex += 1;
      }
    });

    onChange(currentDigits.join('').slice(0, 4));

    if (nextIndex < 4) {
      focusInput(nextIndex);
    }
  };

  const handleKeyDown = (event, index) => {
    const { key } = event;

    if (key === 'Backspace') {
      if (value[index]) {
        const newValue = value.split('').map((digit, position) => (position === index ? '' : digit)).join('').slice(0, 4);
        onChange(newValue);
        return;
      }

      if (index > 0) {
        focusInput(index - 1);
        const newValue = value.split('').map((digit, position) => (position === index - 1 ? '' : digit)).join('').slice(0, 4);
        onChange(newValue);
      }
    }

    if (key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    }

    if (key === 'ArrowRight' && index < 3) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (event, index) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 4 - index);
    if (!pasted) {
      return;
    }

    const currentDigits = value.split('').slice(0, 4);
    for (let i = currentDigits.length; i < 4; i += 1) {
      currentDigits.push('');
    }

    let nextIndex = index;
    pasted.split('').forEach((digit) => {
      if (nextIndex < 4) {
        currentDigits[nextIndex] = digit;
        nextIndex += 1;
      }
    });

    onChange(currentDigits.join('').slice(0, 4));
    if (nextIndex < 4) {
      focusInput(nextIndex);
    }
  };

  return (
    <div className="pin-input-grid">
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="1"
          className="pin-input-box"
          value={value[index] || ''}
          onChange={(event) => handleChange(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => handlePaste(event, index)}
          disabled={disabled}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
