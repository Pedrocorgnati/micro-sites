'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
}

export function WhatsAppButton({
  phone,
  message = 'Olá! Vim pelo site e gostaria de mais informações.',
  className,
}: WhatsAppButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const url = buildWhatsAppUrl(phone, message);

  function handleClick() {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'whatsapp_click', { phone });
    }
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-button"
      aria-label="Conversar via WhatsApp"
      onClick={handleClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2',
        'px-4 py-3 rounded-full shadow-lg',
        'bg-[#25D366] text-white font-medium',
        'transition-transform duration-150 ease-out',
        'hover:scale-105 active:scale-95',
        'animate-pulse-once',
        'min-h-[44px]',
        className,
      )}
    >
      <MessageCircle size={20} aria-hidden="true" />
      <span className="hidden sm:inline">Falar no WhatsApp</span>
    </a>
  );
}
