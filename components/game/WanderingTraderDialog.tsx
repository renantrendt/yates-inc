'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useGame } from '@/contexts/GameContext';

interface WanderingTraderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isRedemption?: boolean; // True if coming from rock HP click (redemption path)
  isInline?: boolean; // True if rendered inside shop modal (no portal/backdrop)
}

type DialogStep = 
  | 'intro'
  | 'offer_1'
  | 'sketchy_response'
  | 'deal_5_offer'
  | 'deal_5_accepted'
  | 'deal_15_offer'
  | 'deal_15_accepted'
  | 'deal_25_offer'
  | 'deal_25_accepted'
  | 'rejected_final'
  // Redemption path
  | 'redemption_intro'
  | 'mad_response'
  | 'sorry_response'
  | 'gift_question'
  | 'gift_accepted'
  | 'favor_question'
  | 'best_offer_question'
  | 'redemption_accepted';

export default function WanderingTraderDialog({ isOpen, onClose, isRedemption = false, isInline = false }: WanderingTraderDialogProps) {
  const { applyWTDialogEffect } = useGame();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<DialogStep>(isRedemption ? 'redemption_intro' : 'intro');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(isRedemption ? 'redemption_intro' : 'intro');
      setIsTyping(true);
      // Typing animation delay (reduced for better UX)
      const timer = setTimeout(() => setIsTyping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRedemption]);

  // Typing effect for each step change (reduced delay for better UX)
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 200); // Reduced from 600ms
    return () => clearTimeout(timer);
  }, [step]);

  const handleOption = (nextStep: DialogStep | 'close' | 'leave' | 'apply_sketchy' | 'apply_deal_5' | 'apply_deal_15' | 'apply_deal_25' | 'apply_ban' | 'apply_mad' | 'apply_gift' | 'apply_redemption') => {
    if (nextStep === 'close' || nextStep === 'leave') {
      onClose();
      return;
    }

    // Apply effects using context function
    if (nextStep === 'apply_sketchy') {
      applyWTDialogEffect('suspicious');
      onClose();
      return;
    }

    if (nextStep === 'apply_deal_5') {
      applyWTDialogEffect('deal_5');
      setStep('deal_5_accepted');
      return;
    }

    if (nextStep === 'apply_deal_15') {
      applyWTDialogEffect('deal_15');
      setStep('deal_15_accepted');
      return;
    }

    if (nextStep === 'apply_deal_25') {
      applyWTDialogEffect('deal_25');
      setStep('deal_25_accepted');
      return;
    }

    if (nextStep === 'apply_ban') {
      applyWTDialogEffect('ban');
      setStep('rejected_final');
      return;
    }

    if (nextStep === 'apply_mad') {
      // Just close, stays banned
      onClose();
      return;
    }

    if (nextStep === 'apply_gift') {
      applyWTDialogEffect('gift');
      setStep('gift_accepted');
      return;
    }

    if (nextStep === 'apply_redemption') {
      applyWTDialogEffect('redemption');
      setStep('redemption_accepted');
      return;
    }

    setStep(nextStep);
  };

  if (!mounted || !isOpen) return null;

  const dialogContent = getDialogContent(step, isTyping, handleOption);

  // Inline mode: render directly without portal/backdrop (used inside shop modal)
  if (isInline) {
    return (
      <div className="p-6">
        <div className="flex gap-4">
          {/* Trader Image */}
          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 relative">
            <Image
              src="/game/characters/wonderingtrader.png"
              alt="Wandering Trader"
              fill
              className="object-contain rounded-lg"
              unoptimized
            />
          </div>

          {/* Dialog Text & Options */}
          <div className="flex-1 min-w-0">
            {dialogContent}
          </div>
        </div>
      </div>
    );
  }

  // Portal mode: render as popup (used for redemption path from rock selector)
  return createPortal(
    <div 
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-gradient-to-b from-gray-900 via-purple-950/30 to-gray-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="bg-gradient-to-r from-purple-900/80 to-gray-900/80 px-6 py-3 border-b border-purple-500/30">
          <h2 className="text-lg font-bold text-purple-200">Wandering Trader</h2>
        </div>

        {/* Dialog Content */}
        <div className="flex p-6 gap-4">
          {/* Trader Image */}
          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 relative">
            <Image
              src="/game/characters/wonderingtrader.png"
              alt="Wandering Trader"
              fill
              className="object-contain rounded-lg"
              unoptimized
            />
          </div>

          {/* Dialog Text & Options */}
          <div className="flex-1 min-w-0">
            {dialogContent}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function getDialogContent(
  step: DialogStep, 
  isTyping: boolean, 
  onOption: (next: DialogStep | 'close' | 'leave' | 'apply_sketchy' | 'apply_deal_5' | 'apply_deal_15' | 'apply_deal_25' | 'apply_ban' | 'apply_mad' | 'apply_gift' | 'apply_redemption') => void
) {
  const TypingIndicator = () => (
    <div className="flex gap-1 py-2">
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );

  const DialogText = ({ children }: { children: React.ReactNode }) => (
    <p className="text-purple-100 text-lg mb-4 leading-relaxed">{children}</p>
  );

  const OptionButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        className="w-full text-left px-4 py-4 rounded-lg border transition-all text-white font-medium bg-purple-700/50 hover:bg-purple-600/50 active:bg-purple-500 border-purple-500/30 hover:border-purple-400/50 touch-manipulation cursor-pointer select-none relative z-10"
      >
        {children}
      </button>
    );
  };

  if (isTyping) {
    return <TypingIndicator />;
  }

  switch (step) {
    case 'intro':
      return (
        <>
          <DialogText>Hey, I hear you want some good stuff huh?</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('offer_1')}>Yeah.</OptionButton>
            <OptionButton onClick={() => onOption('leave')}>Nah.</OptionButton>
          </div>
        </>
      );

    case 'offer_1':
      return (
        <>
          <DialogText>Nice, look I could slide you the goodies with the right price.</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('deal_5_offer')}>Sure, what are you thinking of?</OptionButton>
            <OptionButton onClick={() => onOption('sketchy_response')}>This sounds a lil sketchy...</OptionButton>
          </div>
        </>
      );

    case 'sketchy_response':
      return (
        <>
          <DialogText>Hmpth, that&apos;s why I don&apos;t like you humans!</DialogText>
          <p className="text-red-400 text-sm mb-4">⚠️ Rare offers decreased by 50%, spawn time doubled!</p>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('apply_sketchy')}>Leave</OptionButton>
          </div>
        </>
      );

    case 'deal_5_offer':
      return (
        <>
          <DialogText>For all the money you gain, 5% goes to me. I could offer you 3 extra options on my shop.</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('apply_deal_5')}>That sounds good!</OptionButton>
            <OptionButton onClick={() => onOption('deal_15_offer')}>Hmm, I was thinking of something better.</OptionButton>
          </div>
        </>
      );

    case 'deal_5_accepted':
      return (
        <>
          <DialogText>Awesome! Cya.</DialogText>
          <p className="text-green-400 text-sm mb-4">✓ Deal accepted: 5% money tax, +3 extra shop offers</p>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('close')}>Continue</OptionButton>
          </div>
        </>
      );

    case 'deal_15_offer':
      return (
        <>
          <DialogText>OwO, I see.... Hear me out, if you give me 15% of all money you gain I could give you all of my boosts every time I see you, what do you think?</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('apply_deal_15')}>Yeah sure.</OptionButton>
            <OptionButton onClick={() => onOption('deal_25_offer')}>I know you can do better.</OptionButton>
          </div>
        </>
      );

    case 'deal_15_accepted':
      return (
        <>
          <DialogText>Great making business with you!</DialogText>
          <p className="text-green-400 text-sm mb-4">✓ Deal accepted: 15% money tax, ALL boosts every visit</p>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('close')}>Continue</OptionButton>
          </div>
        </>
      );

    case 'deal_25_offer':
      return (
        <>
          <DialogText>Ohh I see what you&apos;re looking for. I can give you all of my shop options every time I see you for 25% of all money you earn. Ain&apos;t gettin&apos; better than that.</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('apply_deal_25')}>Just what I wanted.</OptionButton>
            <OptionButton onClick={() => onOption('apply_ban')}>Yk what, I don&apos;t feel like it.</OptionButton>
          </div>
        </>
      );

    case 'deal_25_accepted':
      return (
        <>
          <DialogText>.....</DialogText>
          <p className="text-green-400 text-sm mb-4">✓ Deal accepted: 25% money tax, ALL shop options every visit</p>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('close')}>Continue</OptionButton>
          </div>
        </>
      );

    case 'rejected_final':
      return (
        <>
          <DialogText>YOU DISGUSTING BEING! @#$!#$!% #$%! !@%$%^ !#!$% #!$%#$@!!!!</DialogText>
          <p className="text-red-400 text-sm mb-4">💀 The Wandering Trader will never appear again...</p>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('close')}>...</OptionButton>
          </div>
        </>
      );

    // REDEMPTION PATH
    case 'redemption_intro':
      return (
        <>
          <DialogText>Huh? It&apos;s you again? Wth do you want?</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('sorry_response')}>I wanted to say sorry.</OptionButton>
            <OptionButton onClick={() => onOption('mad_response')}>Just piss you off.</OptionButton>
          </div>
        </>
      );

    case 'mad_response':
      return (
        <>
          <DialogText>Oh ok, I see how it is.</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('apply_mad')}>Leave</OptionButton>
          </div>
        </>
      );

    case 'sorry_response':
      return (
        <>
          <DialogText>And I care?</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('gift_question')}>I brought you a gift.</OptionButton>
          </div>
        </>
      );

    case 'gift_question':
      return (
        <>
          <DialogText>Oh really, what is it?</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('apply_gift')}>It&apos;s 80% of all my money.</OptionButton>
          </div>
        </>
      );

    case 'gift_accepted':
      return (
        <>
          <DialogText>Oh... Awesome!</DialogText>
          <p className="text-yellow-400 text-sm mb-4">💰 He took 80% of your money. He now appears 1.25x faster!</p>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('favor_question')}>I would also like a favor.</OptionButton>
          </div>
        </>
      );

    case 'favor_question':
      return (
        <>
          <DialogText>What would that be?</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('best_offer_question')}>Can I get that best offer you had?</OptionButton>
          </div>
        </>
      );

    case 'best_offer_question':
      return (
        <>
          <DialogText>Yeah sure. And you know? You were kind enough to come all the way here, so I&apos;ll accept this for 15% of all money you gain.</DialogText>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('apply_redemption')}>Yeah sure!</OptionButton>
          </div>
        </>
      );

    case 'redemption_accepted':
      return (
        <>
          <DialogText>Great doing business with you again!</DialogText>
          <p className="text-green-400 text-sm mb-4">✓ Redeemed! 15% money tax, ALL boosts every visit</p>
          <div className="space-y-2">
            <OptionButton onClick={() => onOption('close')}>Continue</OptionButton>
          </div>
        </>
      );

    default:
      return null;
  }
}
