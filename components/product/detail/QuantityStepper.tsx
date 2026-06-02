"use client";

import { motion } from "framer-motion";

interface QuantityStepperProps {
  quantity: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function QuantityStepper({
  quantity,
  max,
  onIncrement,
  onDecrement,
}: QuantityStepperProps) {
  const disabledMinus = quantity <= 1;
  const disabledPlus = quantity >= max;

  return (
    <div className="inline-flex items-center rounded-full bg-white"
      style={{ border: "1px solid rgba(0,0,0,0.10)" }}
    >
      <StepBtn
        onClick={onDecrement}
        disabled={disabledMinus}
        label="Disminuir cantidad"
      >
        −
      </StepBtn>
      <motion.span
        key={quantity}
        initial={{ scale: 0.9, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="w-10 text-center text-sm font-semibold tabular-nums"
      >
        {quantity}
      </motion.span>
      <StepBtn
        onClick={onIncrement}
        disabled={disabledPlus}
        label="Aumentar cantidad"
      >
        +
      </StepBtn>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-10 w-10 grid place-items-center text-lg text-black/70 hover:text-black disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  );
}
