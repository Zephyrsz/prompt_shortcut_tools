'use client';

import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function CopyButton({ 
  text, 
  children, 
  className, 
  variant = 'default',
  size = 'default'
}: CopyButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy text: ', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Button
      onClick={handleCopy}
      className={className}
      variant={variant}
      size={size}
    >
      {children || (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </>
      )}
    </Button>
  );
}
